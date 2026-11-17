import fs from "node:fs";
import path from "node:path";

interface TsConfig {
  compilerOptions?: {
    baseUrl?: string;
    jsx?: string;
    paths?: Record<string, string[]>;
  };
  extends?: string | string[];
}

export interface AliasConfig {
  /** Glob patterns for path aliases, mapped to their replacement targets */
  aliasPatterns: Record<string, string[]>;
  /** Directory that `paths` entries are resolved against */
  basePath: string;
}

const emptyConfig: AliasConfig = { aliasPatterns: {}, basePath: "" };

function readStringLiteral(source: string, start: number): number {
  let index = start + 1;
  while (index < source.length) {
    const char = source.charAt(index);
    if (char === "\\") {
      index += 2;
      continue;
    }
    index += 1;
    if (char === `"`) break;
  }
  return index;
}

/** Returns the index just past a comment, or `index` when none starts there */
function skipComment(source: string, index: number): number {
  const char = source.charAt(index);
  const next = source.charAt(index + 1);

  if (char !== "/" || (next !== "/" && next !== "*")) return index;

  if (next === "/") {
    let end = index + 2;
    while (end < source.length && source[end] !== "\n") end += 1;

    return end;
  }

  let end = index + 2;
  while (end < source.length && !(source[end] === "*" && source[end + 1] === "/")) end += 1;

  return end + 2;
}

function skipWhitespace(source: string, index: number): number {
  let end = index;
  while (end < source.length && /\s/u.test(source.charAt(end))) end += 1;

  return end;
}

function closesCollection(source: string, index: number): boolean {
  const next = source[skipWhitespace(source, index)];
  return next === "}" || next === "]";
}

/**
 * Removes `//` and block comments plus trailing commas, skipping the contents
 * of string literals so values like "http://localhost" survive
 */
export function stripJsonComments(source: string): string {
  const { length } = source;
  const parts: string[] = [];
  let chunkStart = 0;
  let index = 0;

  while (index < length) {
    const char = source.charAt(index);

    if (char === `"`) {
      index = readStringLiteral(source, index);
      continue;
    }

    const commentEnd = skipComment(source, index);
    if (commentEnd !== index) {
      parts.push(source.slice(chunkStart, index));
      index = commentEnd;
      chunkStart = index;
      continue;
    }

    if (char === "," && closesCollection(source, index + 1)) {
      parts.push(source.slice(chunkStart, index));
      index += 1;
      chunkStart = index;
      continue;
    }

    index += 1;
  }

  parts.push(source.slice(chunkStart));
  return parts.join("");
}

function resolveExtendsPath(fromFile: string, parent: string): string | null {
  if (!parent.startsWith(".") && !path.isAbsolute(parent)) {
    // Package-relative extends (e.g. "@tsconfig/bun/tsconfig") is out of scope.
    return null;
  }

  const resolved = path.resolve(path.dirname(fromFile), parent);
  if (fs.existsSync(resolved)) return resolved;

  const withExtension = `${resolved.replace(/\.json$/u, "")}.json`;
  return fs.existsSync(withExtension) ? withExtension : null;
}

/** `extends` accepts a single path or a list of them, in either precedence order */
function toExtendsList(extendsValue: string | string[] | undefined): string[] {
  if (extendsValue === undefined) return [];
  return Array.isArray(extendsValue) ? extendsValue : [extendsValue];
}

function mergeTsConfigs(base: TsConfig, override: TsConfig): TsConfig {
  return {
    ...base,
    ...override,
    compilerOptions: { ...base.compilerOptions, ...override.compilerOptions },
  };
}

function parseTsConfigFile(filePath: string, seen: Set<string>): TsConfig {
  if (seen.has(filePath)) return {};

  seen.add(filePath);

  // SAFETY: `stripJsonComments` only removes comments and trailing commas, so
  // the text stays the author's tsconfig JSON; `TsConfig` names exactly the
  // fields read below, and each is optional-chained at the use site
  const parsed = JSON.parse(stripJsonComments(fs.readFileSync(filePath, "utf-8"))) as TsConfig;
  const parents = toExtendsList(parsed.extends);
  let merged: TsConfig = {};

  for (const parent of parents) {
    const parentPath = resolveExtendsPath(filePath, parent);
    if (!parentPath) continue;

    merged = mergeTsConfigs(merged, parseTsConfigFile(parentPath, seen));
  }

  return mergeTsConfigs(merged, parsed);
}

const cacheMeta = Symbol("cacheMeta");

interface CachedConfig {
  /** Merged config, reused verbatim while every contributing file is unchanged */
  tsconfig: TsConfig;
  /** Every file whose content contributed to `tsconfig`, with its mtime */
  [cacheMeta]: Map<string, number>;
}

const configCache = new Map<string, CachedConfig>();

function mtimeOf(filePath: string): number | null {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return null;
  }
}

/**
 * True when every contributing file still exists with the mtime it had at
 * parse time. Keying only the root file would hide a `paths` edit in an
 * `extends` parent, which is where aliases usually live
 */
function isConfigCached(cached: CachedConfig): boolean {
  for (const [filePath, mtime] of cached[cacheMeta]) if (mtimeOf(filePath) !== mtime) return false;

  return true;
}

/**
 * Reads `tsconfig.json` from `cwd` with relative `extends` chains merged in.
 * Returns `{}` when the file is missing or unreadable
 */
export function loadTsConfig(cwd: string): TsConfig {
  const tsconfigPath = path.resolve(cwd, "tsconfig.json");

  if (!fs.existsSync(tsconfigPath)) return {};

  try {
    const cached = configCache.get(tsconfigPath);
    if (cached && isConfigCached(cached)) return cached.tsconfig;

    const seen = new Set<string>();
    const tsconfig = parseTsConfigFile(tsconfigPath, seen);

    const meta = new Map<string, number>();
    for (const filePath of seen) {
      const mtime = mtimeOf(filePath);
      if (mtime !== null) meta.set(filePath, mtime);
    }

    configCache.set(tsconfigPath, { [cacheMeta]: meta, tsconfig });
    return tsconfig;
  } catch (error) {
    // Surfaced instead of swallowed: a broken tsconfig would otherwise silently
    // disable every check that reads it
    console.error(`could not read ${tsconfigPath}: ${String(error)}`);
    return {};
  }
}

export function loadTsConfigAliases(cwd: string): AliasConfig {
  const { compilerOptions } = loadTsConfig(cwd);
  if (!compilerOptions) return emptyConfig;

  return {
    aliasPatterns: compilerOptions.paths ?? {},
    basePath: path.resolve(cwd, compilerOptions.baseUrl ?? "."),
  };
}
