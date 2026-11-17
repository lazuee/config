// tools/shared/tsconfig.ts
import fs from "node:fs";
import path from "node:path";
var emptyConfig = { aliasPatterns: {}, basePath: "" };
function readStringLiteral(source, start) {
  let index = start + 1;
  while (index < source.length) {
    const char = source.charAt(index);
    if (char === "\\") {
      index += 2;
      continue;
    }
    index += 1;
    if (char === `"`)
      break;
  }
  return index;
}
function skipComment(source, index) {
  const char = source.charAt(index);
  const next = source.charAt(index + 1);
  if (char !== "/" || next !== "/" && next !== "*")
    return index;
  if (next === "/") {
    let end = index + 2;
    while (end < source.length && source[end] !== `
`)
      end += 1;
    return end;
  }
  let end = index + 2;
  while (end < source.length && !(source[end] === "*" && source[end + 1] === "/"))
    end += 1;
  return end + 2;
}
function skipWhitespace(source, index) {
  let end = index;
  while (end < source.length && /\s/u.test(source.charAt(end)))
    end += 1;
  return end;
}
function closesCollection(source, index) {
  const next = source[skipWhitespace(source, index)];
  return next === "}" || next === "]";
}
function stripJsonComments(source) {
  const { length } = source;
  const parts = [];
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
function resolveExtendsPath(fromFile, parent) {
  if (!parent.startsWith(".") && !path.isAbsolute(parent)) {
    return null;
  }
  const resolved = path.resolve(path.dirname(fromFile), parent);
  if (fs.existsSync(resolved))
    return resolved;
  const withExtension = `${resolved.replace(/\.json$/u, "")}.json`;
  return fs.existsSync(withExtension) ? withExtension : null;
}
function toExtendsList(extendsValue) {
  if (extendsValue === undefined)
    return [];
  return Array.isArray(extendsValue) ? extendsValue : [extendsValue];
}
function mergeTsConfigs(base, override) {
  return {
    ...base,
    ...override,
    compilerOptions: { ...base.compilerOptions, ...override.compilerOptions }
  };
}
function parseTsConfigFile(filePath, seen) {
  if (seen.has(filePath))
    return {};
  seen.add(filePath);
  const parsed = JSON.parse(stripJsonComments(fs.readFileSync(filePath, "utf-8")));
  const parents = toExtendsList(parsed.extends);
  let merged = {};
  for (const parent of parents) {
    const parentPath = resolveExtendsPath(filePath, parent);
    if (!parentPath)
      continue;
    merged = mergeTsConfigs(merged, parseTsConfigFile(parentPath, seen));
  }
  return mergeTsConfigs(merged, parsed);
}
var cacheMeta = Symbol("cacheMeta");
var configCache = new Map;
function mtimeOf(filePath) {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return null;
  }
}
function isConfigCached(cached) {
  for (const [filePath, mtime] of cached[cacheMeta])
    if (mtimeOf(filePath) !== mtime)
      return false;
  return true;
}
function loadTsConfig(cwd) {
  const tsconfigPath = path.resolve(cwd, "tsconfig.json");
  if (!fs.existsSync(tsconfigPath))
    return {};
  try {
    const cached = configCache.get(tsconfigPath);
    if (cached && isConfigCached(cached))
      return cached.tsconfig;
    const seen = new Set;
    const tsconfig = parseTsConfigFile(tsconfigPath, seen);
    const meta = new Map;
    for (const filePath of seen) {
      const mtime = mtimeOf(filePath);
      if (mtime !== null)
        meta.set(filePath, mtime);
    }
    configCache.set(tsconfigPath, { [cacheMeta]: meta, tsconfig });
    return tsconfig;
  } catch (error) {
    console.error(`could not read ${tsconfigPath}: ${String(error)}`);
    return {};
  }
}
function loadTsConfigAliases(cwd) {
  const { compilerOptions } = loadTsConfig(cwd);
  if (!compilerOptions)
    return emptyConfig;
  return {
    aliasPatterns: compilerOptions.paths ?? {},
    basePath: path.resolve(cwd, compilerOptions.baseUrl ?? ".")
  };
}

export { loadTsConfig, loadTsConfigAliases };
