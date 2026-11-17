import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { defineConfig } from "oxlint";
import type { OxlintConfig } from "oxlint";

import { antiSlopConfig } from "./anti-slop";
import { githubConfig } from "./github";
import { lazueeConfig } from "./lazuee";
import { noCommentSlopConfig } from "./no-comment-slop";
import { reactDoctorConfig } from "./react-doctor";
import { shadcnConfig } from "./shadcn";
import { sonarJSConfig } from "./sonarjs";
import { tailwindConfig } from "./tailwindcss";

const packageRoot = (() => {
  let dir = import.meta.dirname;
  while (!existsSync(path.join(dir, "tools", "oxlint")) && dir !== path.dirname(dir)) {
    dir = path.dirname(dir);
  }
  return dir;
})();

const localPlugin = (relative: string) => path.join(packageRoot, relative);

const jsPluginEntries = [
  { name: "github", specifier: "eslint-plugin-github", config: githubConfig },
  { name: "sonarjs", specifier: "eslint-plugin-sonarjs", config: sonarJSConfig },
  { name: "react-doctor", specifier: "oxlint-plugin-react-doctor", config: reactDoctorConfig },
  { name: "tailwindcss", specifier: "oxlint-tailwindcss", config: tailwindConfig },
  {
    name: "anti-slop",
    specifier: localPlugin("tools/oxlint/config/vendors/anti-slop.js"),
    config: antiSlopConfig,
  },
  {
    name: "no-comment-slop",
    specifier: localPlugin("tools/oxlint/config/vendors/no-comment-slop.js"),
    config: noCommentSlopConfig,
  },
  {
    name: "shadcn",
    specifier: localPlugin("tools/oxlint/config/vendors/shadcn.js"),
    config: shadcnConfig,
  },
  { name: "lazuee", specifier: localPlugin("tools/oxlint/rules/index.js"), config: lazueeConfig },
] as const;

type JSPluginName = (typeof jsPluginEntries)[number]["name"];

/** Vendored plugins are absolute paths; only bare package names are installed */
function isPackageSpecifier(specifier: string): boolean {
  return !path.isAbsolute(specifier);
}

/**
 * True when `specifier` is installed in a `node_modules` at or above `cwd`,
 * mirroring how Node resolves a peer for the project that configured us. The
 * preset's own `node_modules` is not consulted: it sits below the consumer's
 * in an installed package
 */
function isInstalled(specifier: string): boolean {
  let dir = process.cwd();

  while (true) {
    if (existsSync(path.join(dir, "node_modules", specifier))) return true;

    const parent = path.dirname(dir);
    if (parent === dir) return false;

    dir = parent;
  }
}

/**
 * Plugin packages reach the bundle as bare specifiers, so an uninstalled one is
 * only reported by oxlint as a generic "failed to load JS plugin". Naming the
 * package here turns that into an actionable message
 */
function assertPeersInstalled(entries: readonly (typeof jsPluginEntries)[number][]): void {
  const missing = entries
    .map(({ specifier }) => specifier)
    .filter((specifier) => isPackageSpecifier(specifier) && !isInstalled(specifier));

  if (missing.length > 0)
    throw new Error(`install the plugins' peers first (missing: ${missing.join(", ")})`);
}

/**
 * Resolves a package the way Node would from `from`, walking up. Returns the
 * package directory; throws when it is not installed
 */
function resolveFrom(from: string, specifier: string): string {
  let dir = from;

  while (true) {
    const candidate = path.join(dir, "node_modules", specifier);
    if (existsSync(candidate)) return candidate;

    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`${specifier} is not installed`);

    dir = parent;
  }
}

/**
 * `eslint-plugin-sonarjs` pulls in `ts-api-utils`, which reaches for
 * `ts.TypeFlags` that TypeScript 7 no longer ships. Every sonarjs rule imports
 * it at module load, so the whole plugin throws and takes the config with it
 * (upstream declares `typescript >=5 <6.1.0`). Naming the mismatch beats the
 * bare "failed to load JS plugin" oxlint would print
 */
const SONARJS_MAX_TYPESCRIPT_MAJOR = 6;

function assertSonarjsTypescriptVersion(
  entries: readonly (typeof jsPluginEntries)[number][],
): void {
  if (!entries.some(({ name }) => name === "sonarjs") || !isInstalled("eslint-plugin-sonarjs"))
    return;

  let major: number;
  try {
    // What counts is the TypeScript `ts-api-utils` itself would load, which is
    // how sonarjs reaches it; resolving from the project root would describe a
    // different copy whenever the dependency tree nests one
    const apiUtils = resolveFrom(process.cwd(), "ts-api-utils");
    const packageJsonPath = `${resolveFrom(apiUtils, "typescript")}/package.json`;
    major = Number(
      /"version":\s*"(?<major>\d+)/u.exec(readFileSync(packageJsonPath, "utf-8"))?.groups?.major,
    );
  } catch {
    return;
  }

  if (major >= SONARJS_MAX_TYPESCRIPT_MAJOR)
    throw new Error(
      `eslint-plugin-sonarjs supports typescript <${SONARJS_MAX_TYPESCRIPT_MAJOR} but typescript ${major} is installed; ` +
        "install typescript 5 to keep it, or drop the sonarjs preset",
    );
}

const jsPlugins = [...jsPluginEntries].map(({ name, specifier }) => ({ name, specifier }));

const config = defineConfig({
  jsPlugins,
});

// Checked at load: a getter is not evaluated by oxlint's config serializer, and
// a plugin that cannot load is fatal to the whole config anyway
assertPeersInstalled(jsPluginEntries);
assertSonarjsTypescriptVersion(jsPluginEntries);

const defaultConfig: OxlintConfig = config;

export default defaultConfig;

/**
 * Rule and override values merge key-by-key, so only plain objects recurse;
 * arrays concatenate and every other value is replaced
 */
// oxlint-disable-next-line typescript/no-explicit-any anti-slop/no-unsafe-dictionary-type -- merged oxlint config values are arbitrary user config
function isMergeableRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Widens an already-merged plugin config to the preset's declared return type */
function asOxlintConfig(pluginConfig: OxlintConfig): OxlintConfig {
  // SAFETY: every entry in `jsPluginEntries` is a `defineConfig` result, so the
  // value is already an `OxlintConfig` widened only by inference
  return pluginConfig as OxlintConfig;
}

/**
 * Annotated so declaration emit doesn't have to name the merged configs'
 * inferred types, which reference rule option types oxlint does not export
 */
export const selectJsPlugins = (pluginNames: JSPluginName[]): OxlintConfig => {
  const names = new Set<string>(pluginNames);
  const known = new Set<string>(jsPluginEntries.map(({ name }) => name));

  // A typo would otherwise select nothing and silently ship a config with the
  // plugin missing, which only surfaces later as unresolved rules
  const unknown = pluginNames.filter((name) => !known.has(name));
  if (unknown.length > 0)
    throw new Error(
      `selectJsPlugins: unknown plugin ${unknown.join(", ")} (known: ${[...known].join(", ")})`,
    );

  const selected = jsPluginEntries.filter(({ name }) => names.has(name));
  assertPeersInstalled(selected);
  assertSonarjsTypescriptVersion(selected);

  const configs = jsPluginEntries
    .filter(({ name }) => names.has(name))
    .map((entry) => asOxlintConfig(entry.config));
  const isSelectedRule = ([ruleName]: [string, unknown]) => {
    const [pluginName = ""] = ruleName.split("/");
    return names.has(pluginName);
  };

  return defineConfig({
    ...config,
    // oxlint-disable-next-line typescript/no-explicit-any unicorn/no-array-reduce anti-slop/no-unsafe-dictionary-type
    ...configs.reduce(function merge(acc: Record<string, any>, curr: Record<string, any>) {
      for (const [key, val] of Object.entries(curr)) {
        if (Array.isArray(acc[key]) && Array.isArray(val)) {
          acc[key] = [...acc[key], ...val];
        } else if (isMergeableRecord(acc[key]) && isMergeableRecord(val)) {
          acc[key] = merge(acc[key], val);
        } else {
          acc[key] = val;
        }
      }
      return acc;
    }, {}),
    jsPlugins: jsPluginEntries
      .filter((plugin) => names.has(plugin.name))
      .map(({ name, specifier }) => ({ name, specifier })),
    overrides: configs.flatMap(({ overrides = [] }) =>
      overrides.map((x) => ({
        ...x,
        rules: Object.fromEntries(Object.entries(x.rules ?? {}).filter(isSelectedRule)),
      })),
    ),
    rules: Object.assign(
      {},
      ...configs.map(({ rules = {} }) =>
        Object.fromEntries(Object.entries(rules).filter(isSelectedRule)),
      ),
    ),
  });
};
