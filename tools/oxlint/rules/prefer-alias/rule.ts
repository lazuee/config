import fs from "node:fs";
import path from "node:path";

import { defineRule } from "@oxlint/plugins";
import type { ESTree, Options } from "@oxlint/plugins";
import type { AliasConfig } from "@shared/tsconfig";
import { loadTsConfigAliases } from "@shared/tsconfig";

/**
 * Splits a specifier into the filesystem path it names and the URL suffix
 * (`?raw`, `?url`, `#fragment`) that bundlers and the browser strip before
 * resolving. Resolving the whole specifier would make every virtual module
 * look missing.
 */
export function splitSpecifierSuffix(specifier: string): { path: string; suffix: string } {
  const index = specifier.search(/[?#]/u);

  return index === -1
    ? { path: specifier, suffix: "" }
    : { path: specifier.slice(0, index), suffix: specifier.slice(index) };
}

const moduleExtensions = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
] as const;

const fileCheckCache = new Map<string, boolean>();

function isFile(absolutePath: string): boolean {
  const cached = fileCheckCache.get(absolutePath);
  if (cached !== undefined) return cached;

  let exists: boolean;
  try {
    exists = fs.statSync(absolutePath).isFile();
  } catch {
    exists = false;
  }

  fileCheckCache.set(absolutePath, exists);
  return exists;
}

/**
 * A miss records the directories it probed, so it can be retried (instead of
 * trusted forever) once one of them gains an entry: files are routinely created
 * after the first lint of a path during a watch run
 */
const missProbes = new Map<string, Map<string, number>>();

const resolutionCache = new Map<string, string | null>();

/** Cheap bounded directory fingerprint: a new file changes it, nothing else does */
function directoryStamp(directory: string): number {
  try {
    return fs.readdirSync(directory).length;
  } catch {
    return -1;
  }
}

/**
 * Drops every cached verdict for `absolutePath` and the files it could resolve
 * to. The stale-entry list is cheap to keep computed here: extension candidates
 * are derived, never stored
 */
function forgetResolution(absolutePath: string): void {
  resolutionCache.delete(absolutePath);
  missProbes.delete(absolutePath);
  fileCheckCache.delete(absolutePath);

  for (const extension of moduleExtensions) {
    fileCheckCache.delete(`${absolutePath}${extension}`);
    fileCheckCache.delete(path.join(absolutePath, `index${extension}`));
  }
}

function hasFreshlyAppeared(absolutePath: string): boolean {
  const probes = missProbes.get(absolutePath);
  // No record means the miss predates the memo, so assume it may have moved
  if (!probes) return true;

  return ![...probes].every(([directory, stamp]) => directoryStamp(directory) === stamp);
}

/**
 * Adds omitted extensions / `index` files, mirroring bundler module resolution.
 * A miss is memoized together with the directories it probed and re-probed once
 * one of their listings changed
 */
export function resolveModulePath(absolutePath: string): string | null {
  const cached = resolutionCache.get(absolutePath);

  if (cached !== undefined) {
    if (cached !== null || !hasFreshlyAppeared(absolutePath)) return cached;

    forgetResolution(absolutePath);
  }

  const probed = new Map<string, number>();
  const probe = (candidate: string) => {
    const directory = path.dirname(candidate);
    if (!probed.has(directory)) probed.set(directory, directoryStamp(directory));

    return isFile(candidate);
  };

  const candidates = [
    absolutePath,
    ...moduleExtensions.map((extension) => `${absolutePath}${extension}`),
  ];
  let resolved = candidates.find(probe) ?? null;

  if (!resolved)
    resolved =
      moduleExtensions
        .map((extension) => path.join(absolutePath, `index${extension}`))
        .find(probe) ?? null;

  if (resolved === null) missProbes.set(absolutePath, probed);

  resolutionCache.set(absolutePath, resolved);
  return resolved;
}

/**
 * Returns the `*` remainder when `absolutePath` is covered by `pathPattern`,
 * or `null` when it is not. An exact (wildcard-free) match yields `""`.
 *
 * The argument is normalized first: callers derive it from the specifier with
 * `path.resolve`, which keeps `//` and `./` segments a comparison against the
 * normalized prefix below would otherwise miss
 */
export function capturePathRemainder(
  rawAbsolutePath: string,
  basePath: string,
  pathPattern: string,
): string | null {
  const absolutePath = path.normalize(rawAbsolutePath);
  const wildcardIndex = pathPattern.indexOf("*");

  if (wildcardIndex === -1) return absolutePath === path.resolve(basePath, pathPattern) ? "" : null;

  const head = pathPattern.slice(0, wildcardIndex);
  const tail = pathPattern.slice(wildcardIndex + 1);
  const resolvedHead = path.normalize(path.resolve(basePath, head));
  const prefix = resolvedHead.endsWith(path.sep) ? resolvedHead : `${resolvedHead}${path.sep}`;

  if (!absolutePath.startsWith(prefix)) return null;

  let remainder = absolutePath.slice(prefix.length);
  if (tail) {
    if (!remainder.endsWith(tail) || remainder.length === tail.length) return null;

    remainder = remainder.slice(0, remainder.length - tail.length);
  }

  return remainder.replaceAll(path.sep, "/");
}

function collectAliasCandidates(
  absolutePath: string,
  basePath: string,
  aliasPatterns: Record<string, string[]>,
): string[] {
  const candidates: string[] = [];

  for (const [aliasPattern, pathPatterns] of Object.entries(aliasPatterns)) {
    const aliasWildcard = aliasPattern.indexOf("*");

    for (const pathPattern of pathPatterns) {
      const remainder = capturePathRemainder(absolutePath, basePath, pathPattern);
      if (remainder === null) continue;

      if (aliasWildcard === -1) {
        if (remainder === "") candidates.push(aliasPattern);

        continue;
      }

      candidates.push(aliasPattern.slice(0, aliasWildcard) + remainder);
    }
  }

  return candidates;
}

/** Shortest alias spelling for an absolute path, or `null` when unaliased */
export function findBestAliasMatch(
  absolutePath: string,
  basePath: string,
  aliasPatterns: Record<string, string[]>,
): string | null {
  const candidates = collectAliasCandidates(absolutePath, basePath, aliasPatterns);
  let shortest: string | null = null;

  for (const candidate of candidates)
    if (shortest === null || candidate.length < shortest.length) shortest = candidate;

  return shortest;
}

/**
 * Resolves a bare import specifier to an absolute path using every target of a
 * `paths` entry, preferring the one that exists on disk. Falls back to the
 * first candidate so extensionless imports still round-trip.
 */
export function findAliasTarget(
  importPath: string,
  basePath: string,
  aliasPatterns: Record<string, string[]>,
): string | null {
  const candidates: string[] = [];

  for (const [aliasPattern, pathPatterns] of Object.entries(aliasPatterns)) {
    const aliasWildcard = aliasPattern.indexOf("*");

    if (aliasWildcard === -1) {
      if (importPath === aliasPattern) {
        const [pathPattern] = pathPatterns;
        if (pathPattern) candidates.push(path.resolve(basePath, pathPattern));
      }
      continue;
    }

    const aliasBase = aliasPattern.slice(0, aliasWildcard);
    if (!importPath.startsWith(aliasBase)) continue;

    const remainder = importPath.slice(aliasBase.length);

    for (const pathPattern of pathPatterns) {
      const pathWildcardIndex = pathPattern.indexOf("*");
      if (pathWildcardIndex === -1) continue;

      candidates.push(
        path.resolve(
          basePath,
          `${pathPattern.slice(0, pathWildcardIndex)}${remainder}${pathPattern.slice(pathWildcardIndex + 1)}`,
        ),
      );
    }
  }

  if (candidates.length === 0) return null;

  return candidates.find((candidate) => resolveModulePath(candidate)) ?? candidates[0] ?? null;
}

/** True when `importPath` is matched by one of the configured `paths` keys */
export function matchesAliasPattern(
  importPath: string,
  aliasPatterns: Record<string, string[]>,
): boolean {
  for (const aliasPattern of Object.keys(aliasPatterns)) {
    const wildcardIndex = aliasPattern.indexOf("*");

    if (wildcardIndex === -1) {
      if (importPath === aliasPattern) return true;

      continue;
    }

    const head = aliasPattern.slice(0, wildcardIndex);
    const tail = aliasPattern.slice(wildcardIndex + 1);

    if (tail) {
      if (importPath.endsWith(tail) && importPath.length >= head.length + tail.length) return true;

      continue;
    }

    if (importPath.startsWith(head) && importPath.length > head.length) return true;
  }

  return false;
}

const installedPackageCache = new Map<string, boolean>();

function pathExists(absolutePath: string): boolean {
  try {
    fs.statSync(absolutePath);
    return true;
  } catch {
    return false;
  }
}

function isRelativeImport(importPath: string): boolean {
  return (
    ["./", "../"].some((prefix) => importPath.startsWith(prefix)) ||
    importPath === "." ||
    importPath === ".."
  );
}

/**
 * npm package name a specifier belongs to: the first two segments of a scoped
 * name, otherwise the first segment. `null` for relative and builtin paths
 */
function packageNameOf(importPath: string): string | null {
  if (importPath === "." || importPath === ".." || isRelativeImport(importPath)) return null;

  const segments = importPath.split("/");
  const [first] = segments;
  if (first === undefined || first === "") return null;

  // `node:fs` and friends are never installed under node_modules
  if (first.includes(":")) return null;

  return first.startsWith("@") ? segments.slice(0, 2).join("/") : first;
}

/** Guards npm packages that share a prefix with an alias (`@oxlint/plugins`) */
export function isInstalledPackage(
  importPath: string,
  cwd: string,
  exists: (absolutePath: string) => boolean = pathExists,
): boolean {
  const packageName = packageNameOf(importPath);
  if (!packageName) return false;

  const cacheKey = `${cwd}\n${packageName}`;
  const cached = installedPackageCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const installed = exists(path.join(cwd, "node_modules", packageName));
  installedPackageCache.set(cacheKey, installed);
  return installed;
}

/**
 * The installed package a specifier names, or `null`. Lets a caller resolve one
 * package once and then compare prefix matches in memory instead of probing
 * `node_modules` again per alias candidate
 */
export function installedPackageOf(
  importPath: string,
  cwd: string,
  exists: (absolutePath: string) => boolean = pathExists,
): string | null {
  const packageName = packageNameOf(importPath);

  return packageName && isInstalledPackage(importPath, cwd, exists) ? packageName : null;
}

/**
 * True when `absolutePath` is a direct sibling of the importer (same directory).
 * A descendant check was wrong here: for a file at the config root, every
 * module is a descendant, which both suppressed legitimate alias rewrites and
 * forced correct aliases back into long relative paths.
 */
function isSameDirectory(absolutePath: string, directory: string): boolean {
  return path.dirname(absolutePath) === directory;
}

function toRelativeImport(importerDirectory: string, absolutePath: string): string {
  const relativePath = path.relative(importerDirectory, absolutePath).replaceAll(path.sep, "/");
  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
}

/**
 * Resolution adds the real extension so alias roots can be compared, but the
 * rewrite must keep the specifier's original spelling: an extension the author
 * omitted stays omitted, and a `?raw`-style suffix travels with the rewrite
 */
export function preserveExtensionOmission(original: string, suggested: string): string {
  const { path: originalPath, suffix } = splitSpecifierSuffix(original);
  const extension = /\.[^./]+$/u.exec(suggested)?.[0] ?? "";
  const kept =
    extension !== "" && !originalPath.endsWith(extension)
      ? suggested.slice(0, -extension.length)
      : suggested;

  return `${kept}${suffix}`;
}

function isStringEntry(value: unknown): value is string {
  return typeof value === "string";
}

/** A `paths` target list: either one specifier or several */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isStringEntry);
}

/** The object form of a rule option, as opposed to its array or scalar forms */
type OptionObject = Record<string, Options[number]>;

function isOptionObject(value: Options[number] | undefined): value is OptionObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Rule options arrive as raw JSON, so `alias` is decoded here: a bare string
 * becomes a one-entry target list, and anything else is dropped. Every key is
 * normalized to a string[] so a string form cannot silently disable an alias
 */
function parseOptionsAlias(options: readonly Options[number][]) {
  const option = options.find(isOptionObject);
  const alias = option?.alias;
  const parsed: Record<string, string[]> = {};

  if (!isOptionObject(alias)) return parsed;

  for (const [key, value] of Object.entries(alias)) {
    if (isStringEntry(value)) {
      parsed[key] = [value];
      continue;
    }

    if (isStringArray(value) && value.length > 0) parsed[key] = value;
  }

  return parsed;
}

/**
 * Rule options are ambient for the whole run, so the merged alias config is
 * keyed by them: a per-plugin write of `config` would miss the next one and
 * re-read (and re-trust) the tsconfig for every file and every alias lookup.
 *
 * The tsconfig is still re-read when its files change; `loadTsConfigAliases`
 * hands back a new object then, which is what invalidates this entry
 */
const aliasConfigCache = new Map<string, { config: AliasConfig; patterns: string[] }>();

function loadAliasConfig(cwd: string, options: readonly Options[number][]): AliasConfig {
  const key = `${cwd}\n${JSON.stringify(options)}`;
  const loaded = loadTsConfigAliases(cwd);
  const patterns = Object.entries(loaded.aliasPatterns).flatMap(([alias, targets]) => [
    alias,
    ...targets,
  ]);
  const cached = aliasConfigCache.get(key);

  if (cached && cached.patterns.join("\n") === patterns.join("\n")) return cached.config;

  const config: AliasConfig = {
    aliasPatterns: { ...loaded.aliasPatterns, ...parseOptionsAlias(options) },
    basePath: loaded.basePath || cwd,
  };
  aliasConfigCache.set(key, { config, patterns });

  return config;
}

/**
 * Best alias spelling for a resolved target, but only when it genuinely beats
 * the current specifier on character length (resolution-added extensions do not
 * count against the alias)
 */
function findShorterAlias(
  absolutePath: string,
  basePath: string,
  aliasPatterns: Record<string, string[]>,
  currentSpelling: string,
): string | null {
  const match = findBestAliasMatch(absolutePath, basePath, aliasPatterns);
  if (!match || match === currentSpelling) return null;

  return preserveExtensionOmission(currentSpelling, match).length < currentSpelling.length
    ? match
    : null;
}

type ModuleSpecifierNode =
  | ESTree.ImportDeclaration
  | ESTree.ExportNamedDeclaration
  | ESTree.ExportAllDeclaration;

function hasStaticModuleSpecifier(node: ESTree.Node): node is ModuleSpecifierNode {
  // Only import/export forms carry a module specifier
  return (
    node.type === "ImportDeclaration" ||
    node.type === "ExportNamedDeclaration" ||
    node.type === "ExportAllDeclaration"
  );
}

export const preferAlias = defineRule({
  createOnce: (context) => {
    // `context.cwd` is only readable from within a visitor, so the tsconfig
    // lookup happens per module specifier. `loadAliasConfig` is memoized, so
    // the per-file call is a string compare until the tsconfig or options change
    const checkModuleSpecifier = (node: ESTree.Node) => {
      if (!hasStaticModuleSpecifier(node)) return;

      const { source } = node;
      // `export { A }` without a module specifier has no source to check
      if (!source) return;

      const { aliasPatterns, basePath } = loadAliasConfig(context.cwd, context.options);

      if (Object.keys(aliasPatterns).length === 0) return;

      const importPath = source.value;
      // `?raw` / `#frag` are not part of the path on disk, so the lookup uses
      // the bare specifier and the suffix is re-attached by the report
      const { path: bareSpecifier, suffix } = splitSpecifierSuffix(importPath);
      const importerDirectory = path.dirname(context.filename);
      const relativeImport = isRelativeImport(bareSpecifier);
      const absoluteImport = relativeImport
        ? (resolveModulePath(path.resolve(importerDirectory, bareSpecifier)) ??
          path.resolve(importerDirectory, bareSpecifier))
        : findAliasTarget(bareSpecifier, basePath, aliasPatterns);

      if (!absoluteImport) return;

      const report = (candidate: string, messageId: string) => {
        const newPath = preserveExtensionOmission(importPath, candidate);
        // A `?raw`-style suffix can only be kept when the original carried one;
        // a suggestion that adds one would not resolve
        if (suffix !== "" && newPath === importPath) return;

        context.report({
          data: { newPath, path: importPath },
          fix: (fixer) =>
            fixer.replaceTextRange([source.range[0] + 1, source.range[1] - 1], newPath),
          messageId,
          node,
        });
      };

      /**
       * Siblings stay relative; anything across a directory boundary is a
       * candidate for an alias, but only when that alias is genuinely shorter.
       * Reports through `report` and returns whether it did
       */
      const preferSiblingOrShorter = (target: string, messageId: string): boolean => {
        if (isSameDirectory(target, importerDirectory)) {
          const relative = toRelativeImport(importerDirectory, target);
          // A relative importer already sitting here is spelled right; compare
          // the spelling `report` would emit, since resolution adds extensions
          if (preserveExtensionOmission(importPath, relative) === importPath) return false;

          report(relative, "import");
          return true;
        }

        const match = findShorterAlias(target, basePath, aliasPatterns, importPath);
        if (!match) return false;

        report(match, messageId);
        return true;
      };

      if (!relativeImport) {
        // One `node_modules` probe for the whole specifier instead of one per
        // alias candidate
        const installedPackage = installedPackageOf(bareSpecifier, context.cwd);

        if (installedPackage) {
          // A specifier that is an installed package, or that no `paths` key
          // claims, is outside this rule: rewriting it breaks resolution even
          // though the alias prefix can be made to resolve onto local files
          if (!matchesAliasPattern(bareSpecifier, aliasPatterns)) return;

          // A package entry point stays a package specifier; a deep import may
          // point at a local file the alias spells shorter
          if (bareSpecifier.length <= installedPackage.length) return;
        } else if (!matchesAliasPattern(bareSpecifier, aliasPatterns)) return;

        // An alias pointing at a sibling of the importer reads better relative
        preferSiblingOrShorter(absoluteImport, "shortAlias");
        return;
      }

      preferSiblingOrShorter(absoluteImport, "import");
    };

    return {
      ImportDeclaration: checkModuleSpecifier,
      ExportAllDeclaration: checkModuleSpecifier,
      ExportNamedDeclaration: checkModuleSpecifier,
    };
  },
  meta: {
    defaultOptions: [{}],
    fixable: "code" as const,
    messages: {
      import: "Unexpected import {{path}}. Use {{newPath}} instead",
      shortAlias: "Prefer importing {{newPath}} over {{path}}",
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          alias: {
            description:
              "Optional map of additional aliases (overrides tsconfig.json if provided). Can be string or array of strings.",
            type: "object",
          },
        },
        type: "object",
      },
    ],
    hasSuggestions: true,
    type: "suggestion" as const,
  },
});
