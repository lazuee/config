/**
 * Vendors a git-hosted package into a self-contained ESM file, plus any
 * sibling bundles it spawns at runtime (e.g. a worker script).
 *
 * Clones `repoUrl` at `ref`, installs dependencies, bundles `entrypoint`
 * (and each `auxiliary` entrypoint) with Bun, and writes `banner + bundle`
 * to `outFile`, with auxiliary files landing next to it.
 *
 * Every statically imported module is inlined; only node builtins may stay
 * external. Modules reached through runtime require()/import() are never
 * inlined.
 *
 * `replacements` are applied to the main bundle before it is written, e.g. to
 * point a worker reference at a namespaced auxiliary file.
 *
 * Optionally verifies that every rule a local preset enables is registered in
 * the bundled ESLint/oxlint plugin (`rules`); registered rules the preset
 * leaves unenabled are logged, since presets may pick a subset.
 *
 * In `checkOnly` mode nothing is written and an error is thrown when `outFile`
 * (or an auxiliary sibling) is not the byte-exact vendoring of `ref`, so CI
 * can catch a stale vendor.
 *
 * Errors are thrown, never swallowed: callers decide how to report them.
 */
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { builtinModules } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";

export interface RuleSyncOptions {
  /** File that enables the rules (e.g. an oxlint preset) */
  configFile: string;
  /** Prefix the config keys rules with, e.g. "shadcn" for `"shadcn/no-raw-colors"` */
  namespace: string;
}

export interface BannerContext {
  commit: string;
  ref: string;
  repoUrl: string;
}

export interface AuxiliaryBundle {
  /** Bundle entrypoint, relative to the repo root */
  entrypoint: string;
  /** Filename written next to `outFile` (e.g. `"shadcn-tailwind-worker.ts"`) */
  fileName: string;
}

/** A find/replace applied to the main bundle before it is written */
export interface Replacement {
  find: string | RegExp;
  replace: string;
}

export interface VendorOptions {
  /** Git URL to clone */
  repoUrl: string;
  /** Commit SHA, tag, or branch to vendor */
  ref: string;
  /** Bundle entrypoint, relative to the repo root */
  entrypoint: string;
  /**
   * Extra entrypoints bundled to sibling files of `outFile` (e.g. a worker
   * script the plugin spawns at runtime). Each is self-contained on its own.
   */
  auxiliary?: AuxiliaryBundle[];
  /** Absolute path of the file to write (or check) */
  outFile: string;
  /** Text prepended to the bundle; include a trailing newline */
  banner: string | ((context: BannerContext) => string);
  /** Write nothing; throw if `outFile` is not the byte-exact vendoring of `ref` */
  checkOnly?: boolean;
  /**
   * Command run in the clone to install dependencies. Must be a full install
   * (not production-only) so dependencies you want inlined are present.
   * Pass `null` to skip. Default: `["bun", "install"]`
   */
  installCommand?: string[] | null;
  /** Module specifiers to keep external (never inlined). Default: none */
  external?: string[];
  /**
   * find/replace pairs applied to the main bundle before it is written, e.g. to
   * point a worker reference at a namespaced auxiliary file.
   */
  replacements?: Replacement[];
  /**
   * Fail when the preset enables a rule the bundle does not register; log the
   * registered rules the preset leaves unenabled (presets may enable a subset)
   */
  rules?: RuleSyncOptions;
  /** Command shown in the "stale vendor" error. Default: generic message */
  regenerateHint?: string;
  /** Base for relative paths in messages. Default: `process.cwd()` */
  cwd?: string;
  /** Progress/result logger. Default: `console.log` */
  log?: (message: string) => void;
}

export interface VendorResult {
  commit: string;
  outFile: string;
  status: "written" | "up-to-date";
}

/** node builtins (bare and `node:`-prefixed) stay external in a node bundle */
const NODE_BUILTINS = new Set([...builtinModules, ...builtinModules.map((mod) => `node:${mod}`)]);

const escapeRegExp = (value: string): string => value.replaceAll(/[.*+?^${}()|[\]\\]/gu, "\\$&");

function isBannerFactory(
  banner: VendorOptions["banner"],
): banner is (context: BannerContext) => string {
  return typeof banner === "function";
}

const run = (command: string[], cwd: string): string => {
  const result = Bun.spawnSync(command, { cwd, stderr: "inherit" });
  if (result.exitCode !== 0) throw new Error(`${command.join(" ")} failed in ${cwd}`);

  return result.stdout.toString().trim();
};

/** Index of the `}` that closes the object opened at `open`, or -1 */
const matchBrace = (text: string, open: number): number => {
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    else if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
};

/**
 * Rule ids in the plugin's own `rules` object, as bundled.
 *
 * Every `rules: { … }` / `rules = { … }` object in the bundle is a candidate
 * (upstream may ship presets in the same file, e.g. `configs.recommended.rules`),
 * so take the one with the most bare rule-id keys: preset entries are
 * namespaced (`"ns/rule": …`) and never match.
 */
const extractBundleRuleIds = (bundle: string): string[] => {
  let best: string[] = [];
  for (const marker of bundle.matchAll(/\brules\s*[:=]\s*\{/gu)) {
    const open = bundle.indexOf("{", marker.index);
    const close = matchBrace(bundle, open);
    if (close === -1) continue;
    const ids = [...bundle.slice(open, close + 1).matchAll(/"(?<id>[a-z0-9-]+)":/gu)].flatMap(
      ({ groups }) => (groups?.id === undefined ? [] : [groups.id]),
    );
    if (ids.length > best.length) best = ids;
  }
  if (best.length === 0) {
    throw new Error(
      "could not locate the plugin rules registry in the bundle — upstream changed its plugin shape; review the generated output by hand",
    );
  }
  return best;
};

/** Rule ids the preset enables, keyed as `"<namespace>/<id>"` */
const extractConfiguredRuleIds = async ({
  configFile,
  namespace,
}: RuleSyncOptions): Promise<string[]> => {
  const source = await readFile(configFile, "utf-8");
  const pattern = new RegExp(`"${escapeRegExp(namespace)}/(?<id>[a-z0-9-]+)":`, "gu");
  return [...source.matchAll(pattern)].flatMap(({ groups }) =>
    groups?.id === undefined ? [] : [groups.id],
  );
};

/**
 * Fail when the preset enables a rule the bundle does not register, since that
 * is a broken config. A preset may legitimately leave registered rules unenabled
 * (it picks a subset); those are logged for review when bumping the ref.
 */
const assertRulesInSync = async (
  bundle: string,
  rules: RuleSyncOptions,
  cwd: string,
  log: (message: string) => void,
): Promise<void> => {
  const bundleRuleIds = extractBundleRuleIds(bundle);
  const configuredRuleIds = new Set(await extractConfiguredRuleIds(rules));

  const unknown = [...configuredRuleIds].filter((id) => !bundleRuleIds.includes(id));
  if (unknown.length > 0) {
    const configPath = path.relative(cwd, rules.configFile);
    throw new Error(
      `${configPath} enables rules the bundle does not register: ${unknown.join(", ")}`,
    );
  }

  const unconfigured = bundleRuleIds.filter((id) => !configuredRuleIds.has(id));
  if (unconfigured.length > 0) {
    const configPath = path.relative(cwd, rules.configFile);
    log(
      `${configPath} leaves these registered rules unenabled (fine if intentional): ${unconfigured.join(", ")}`,
    );
  }
};

/** Every statically imported module must be inlined; only node builtins may remain */
const assertSelfContained = (bundle: string): void => {
  // `from "…"` marks a static import/export (import() and side-effect
  // imports have no `from`)
  const staticExternals = [...bundle.matchAll(/\bfrom\s+["'](?<spec>[^"']+)["']/gu)]
    .flatMap((match) => (match.groups?.spec === undefined ? [] : [match.groups.spec]))
    .filter((spec) => !NODE_BUILTINS.has(spec));
  if (staticExternals.length > 0) {
    throw new Error(
      `bundled output is not self-contained — static imports were not inlined: ${[
        ...new Set(staticExternals),
      ].join(", ")}`,
    );
  }
};

/** Apply find/replace pairs to a bundle, in order */
const applyReplacements = (text: string, replacements: Replacement[]): string => {
  let result = text;
  for (const { find, replace } of replacements) result = result.replaceAll(find, replace);

  return result;
};

interface Sibling {
  outPath: string;
  content: string;
}

/**
 * Settle the vendoring. In `checkOnly` mode, read `outFile` and every sibling
 * and throw when any is missing or differs from its expected content;
 * otherwise write them all. Returns which outcome occurred.
 */
const settle = async (
  outFile: string,
  content: string,
  siblings: Sibling[],
  checkOnly: boolean,
  ref: string,
  cwd: string,
  regenerateHint: string,
): Promise<VendorResult["status"]> => {
  if (checkOnly) {
    const [current, ...existingSiblings] = await Promise.all([
      readFile(outFile, "utf-8").catch(() => null),
      ...siblings.map(({ outPath }) => readFile(outPath, "utf-8").catch(() => null)),
    ]);
    if (current === null) throw new Error(`${path.relative(cwd, outFile)} is missing`);

    if (current !== content) {
      throw new Error(
        `${path.relative(cwd, outFile)} is not the vendoring of ${ref} — ${regenerateHint} and review the diff`,
      );
    }

    for (const [i, { outPath, content: siblingContent }] of siblings.entries()) {
      const label = path.relative(cwd, outPath);
      const sibling = existingSiblings[i];
      if (sibling === null || sibling === undefined) throw new Error(`${label} is missing`);

      if (sibling !== siblingContent) {
        throw new Error(
          `${label} is not the vendoring of ${ref} — ${regenerateHint} and review the diff`,
        );
      }
    }

    return "up-to-date";
  }

  await writeFile(outFile, content);
  await Promise.all(
    siblings.map(({ outPath, content: siblingContent }) => writeFile(outPath, siblingContent)),
  );
  return "written";
};

export const vendorFromGit = async (options: VendorOptions): Promise<VendorResult> => {
  const {
    repoUrl,
    ref,
    entrypoint,
    outFile,
    banner,
    checkOnly = false,
    installCommand = ["bun", "install"],
    external = [],
    auxiliary = [],
    replacements = [],
    rules,
    regenerateHint = "re-run the vendor script",
    cwd = process.cwd(),
    log = console.log,
  } = options;

  const cloneDir = await mkdtemp(path.join(tmpdir(), "vendor-"));

  try {
    // Blobless partial clone: cheap full history, so any ref (SHA, tag, or
    // branch) checks out without falling back to a full clone
    run(["git", "clone", "--quiet", "--filter=blob:none", "--no-checkout", repoUrl, "."], cloneDir);
    run(["git", "checkout", "--quiet", ref], cloneDir);
    const commit = run(["git", "rev-parse", "HEAD"], cloneDir);

    if (installCommand) run(installCommand, cloneDir);

    const entryPoints = [
      path.join(cloneDir, entrypoint),
      ...auxiliary.map((file) => path.join(cloneDir, file.entrypoint)),
    ];

    const build = await Bun.build({
      entrypoints: entryPoints,
      external,
      format: "esm",
      target: "node",
    });

    if (!(build.success && build.outputs.length === entryPoints.length))
      throw new Error(`bundling failed: ${build.logs.map(String).join("\n")}`);

    const [mainOutput, ...auxiliaryOutputs] = build.outputs;
    if (!mainOutput) throw new Error("bundling failed: missing output");

    // Bun emits a `// <path>` module comment relative to cwd, so it names the
    // throwaway clone dir and, for inlined dependencies, bun's layout-specific
    // `node_modules/.bun/…` path; strip both so re-vendoring stays byte-stable
    const cloneDirPattern = new RegExp(`^// \\S*${escapeRegExp(path.basename(cloneDir))}/`, "gmu");
    const toBundle = async (output: Bun.BuildArtifact): Promise<string> => {
      const raw = await output.text();
      return raw.replaceAll(cloneDirPattern, "// ").replaceAll(/^\/\/ .*node_modules\/.*\n/gmu, "");
    };

    const bundle = applyReplacements(await toBundle(mainOutput), replacements);
    assertSelfContained(bundle);
    if (rules) await assertRulesInSync(bundle, rules, cwd, log);

    const header = isBannerFactory(banner) ? banner({ commit, ref, repoUrl }) : banner;
    const content = header + bundle;

    const siblings = await Promise.all(
      auxiliary.map(async (file, index) => {
        const output = auxiliaryOutputs[index];
        if (!output) throw new Error("bundling failed: missing auxiliary output");
        const auxBundle = await toBundle(output);
        assertSelfContained(auxBundle);
        return {
          outPath: path.join(path.dirname(outFile), file.fileName),
          content: header + auxBundle,
        };
      }),
    );

    const status = await settle(outFile, content, siblings, checkOnly, ref, cwd, regenerateHint);
    if (status === "up-to-date") log(`${repoUrl}@${commit} is up to date`);
    else log(`Vendored ${repoUrl}@${commit} to ${outFile}`);
    return { commit, outFile, status };
  } finally {
    await rm(cloneDir, { force: true, recursive: true });
  }
};
