// tools/oxlint/config/vendors/shadcn-tailwind-worker.ts
import { workerData } from "node:worker_threads";
import * as fs5 from "node:fs";
import { createRequire } from "node:module";
import * as path6 from "node:path";
import { pathToFileURL } from "node:url";
import * as fs3 from "node:fs";
import * as path3 from "node:path";
import * as fs from "node:fs";
import * as path from "node:path";
import * as fs2 from "node:fs";
import * as path2 from "node:path";
function splitVariants(token) {
  if (!token.includes(":"))
    return { variants: [], base: token };
  const segments = [];
  let bracketDepth = 0;
  let parenDepth = 0;
  let current = "";
  for (const char of token) {
    if (char === "[") {
      bracketDepth++;
    } else if (char === "]") {
      bracketDepth--;
    } else if (bracketDepth === 0) {
      if (char === "(") {
        parenDepth++;
      } else if (char === ")") {
        parenDepth--;
      }
    }
    if (char === ":" && bracketDepth === 0 && parenDepth === 0) {
      segments.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  segments.push(current);
  return {
    variants: segments.slice(0, -1),
    base: segments[segments.length - 1]
  };
}
var MARKERS = new Set(["group", "peer", "dark", "light"]);
var COLOR_PREFIX = /^(?:text-shadow|inset-shadow|inset-ring|drop-shadow|scrollbar-(?:thumb|track)|ring-offset|border(?:-[trblxyse]|-[bi][se])?|divide(?:-[xy])?|mask-(?:linear|radial|conic|[trblxy])-(?:from|to)|bg|text|ring|outline|fill|stroke|from|via|to|accent|caret|decoration|placeholder|shadow)-/;
var PALETTE = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "mauve",
  "olive",
  "mist",
  "taupe",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose"
];
var OPACITY_MODIFIER = /\/(?:[\w.%]+|\[[^[\]]*\]|\([^()]*\))$/;
var PALETTE_RE = new RegExp(`${COLOR_PREFIX.source}(?:${PALETTE.join("|")})-\\d{2,3}(?:${OPACITY_MODIFIER.source})?$`);
function editDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d = Array.from({ length: rows }, (_, i) => {
    const row = new Array(cols).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0;j < cols; j++)
    d[0][j] = j;
  for (let i = 1;i < rows; i++) {
    for (let j = 1;j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[rows - 1][cols - 1];
}
function didYouMean(value, candidates, budget = value.length < 6 ? 1 : 2) {
  if (value.length < 3)
    return null;
  let best = null;
  for (const name of candidates) {
    if (name === value)
      return null;
    if (Math.abs(name.length - value.length) > budget)
      continue;
    const distance = editDistance(value, name);
    if (distance > budget)
      continue;
    if (!best || distance < best.distance || distance === best.distance && name.localeCompare(best.name) < 0) {
      best = { name, distance };
    }
  }
  return best?.name ?? null;
}
var TTL = 1000;
var MAX_MEMO_ENTRIES = 50000;
var memo = new Map;
function memoize(key, compute, stale) {
  const hit = memo.get(key);
  const now = Date.now();
  if (hit && now - hit.at < TTL && !stale?.(hit.value)) {
    return hit.value;
  }
  const value = compute();
  if (memo.size >= MAX_MEMO_ENTRIES && !memo.has(key)) {
    for (const oldest of memo.keys()) {
      memo.delete(oldest);
      if (memo.size <= MAX_MEMO_ENTRIES * 0.75) {
        break;
      }
    }
  }
  memo.set(key, { at: now, value });
  return value;
}
var dirs = new Map;
function dirOf(file) {
  let dir = dirs.get(file);
  if (dir === undefined) {
    if (dirs.size > 20000)
      dirs.clear();
    dir = path.dirname(path.resolve(file));
    dirs.set(file, dir);
  }
  return dir;
}
function isFile(p) {
  return memoize(`file:${p}`, () => {
    try {
      return fs.statSync(p).isFile();
    } catch {
      return false;
    }
  });
}
function mtimeOf(p) {
  return memoize(`mtime:${p}`, () => {
    try {
      return fs.statSync(p).mtimeMs;
    } catch {
      return null;
    }
  });
}
function realpath(p) {
  return memoize(`real:${p}`, () => {
    try {
      return fs.realpathSync.native(p);
    } catch {
      return p;
    }
  });
}
function findUp(fromDir, name) {
  const start = path.resolve(fromDir);
  return memoize(`up:${start}|${name}`, () => {
    let dir = start;
    for (let depth = 0;depth < 32; depth++) {
      const candidate = path.join(dir, name);
      if (memoize(`exists:${candidate}`, () => fs.existsSync(candidate))) {
        return candidate;
      }
      const parent = path.dirname(dir);
      if (parent === dir)
        break;
      dir = parent;
    }
    return null;
  });
}
var EXTENSIONS = [
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mjs",
  ".cjs",
  ".css",
  ".svelte",
  ".vue"
];
var SOURCE_FOR_JS = {
  ".js": [".ts", ".tsx"],
  ".jsx": [".tsx"],
  ".mjs": [".mts", ".ts"],
  ".cjs": [".cts", ".ts"]
};
function readJsonc(file) {
  let text;
  try {
    text = fs2.readFileSync(file, "utf-8");
  } catch {
    return null;
  }
  let out = "";
  let i = 0;
  let quote = null;
  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];
    if (quote) {
      out += ch;
      if (ch === "\\") {
        out += next ?? "";
        i += 2;
        continue;
      }
      if (ch === quote)
        quote = null;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      i++;
      continue;
    }
    if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== `
`)
        i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/"))
        i++;
      i += 2;
      continue;
    }
    out += ch;
    i++;
  }
  out = out.replace(/,(\s*[}\]])/g, "$1");
  try {
    return JSON.parse(out);
  } catch {
    return null;
  }
}
function packageRoot(fromFile) {
  const file = findUp(dirOf(fromFile), "package.json");
  return file ? path2.dirname(file) : null;
}
function matchPattern(pattern, value) {
  const star = pattern.indexOf("*");
  if (star === -1)
    return pattern === value ? "" : null;
  const prefix = pattern.slice(0, star);
  const suffix = pattern.slice(star + 1);
  if (value.length < prefix.length + suffix.length || !value.startsWith(prefix) || !value.endsWith(suffix))
    return null;
  return value.slice(prefix.length, value.length - suffix.length);
}
function expand(target, captured) {
  return target.replace("*", captured);
}
function isUncPath(file) {
  return /^[\\/]{2}/.test(file);
}
function isInside(dir, file) {
  const relative2 = path2.relative(dir, file);
  return relative2 !== ".." && !relative2.startsWith(`..${path2.sep}`) && !path2.isAbsolute(relative2);
}
function isStrayUncPath(file, ...within) {
  return isUncPath(file) && !within.some((dir) => isInside(dir, file));
}
var BAD_SEGMENT = /^(?:\.|%2e){1,2}$|^node_modules$/i;
function safeSegments(text) {
  return !/%2f|%5c/i.test(text) && !text.split(/[\\/]/).some((segment) => BAD_SEGMENT.test(segment));
}
function isPackageTarget(target) {
  return target.startsWith("./") && safeSegments(target.slice(2));
}
function packageTarget(dir, target, captured = "") {
  if (!isPackageTarget(target) || !safeSegments(captured))
    return null;
  const file = path2.resolve(dir, expand(target, captured));
  return isInside(dir, file) ? file : null;
}
function isBareTarget(target) {
  return /^[^./\\#][^:\\]*$/.test(target);
}
var tsconfigCache = new Map;
function signatureOf(files) {
  return files.map((file) => `${file}:${mtimeOf(file) ?? "missing"}`).join("|");
}
function readTsconfigChain(file, visiting, files) {
  if (visiting.has(file) || visiting.size > 8)
    return [];
  visiting.add(file);
  files.push(file);
  const json = readJsonc(file);
  if (!json || typeof json !== "object")
    return [];
  const dir = path2.dirname(file);
  const options = json.compilerOptions ?? {};
  const base = typeof options.baseUrl === "string" && options.baseUrl ? path2.resolve(dir, options.baseUrl) : dir;
  const paths = options.paths && typeof options.paths === "object" && !Array.isArray(options.paths) ? options.paths : {};
  const own = Object.entries(paths).map(([pattern, targets]) => ({
    pattern,
    targets: Array.isArray(targets) ? targets.filter((target) => typeof target === "string") : [],
    base
  }));
  const parents = [].concat(json.extends ?? []);
  const inherited = parents.flatMap((parent) => {
    const resolved = resolveFile(String(parent), dir, dir, [".json"], {
      skipPaths: true
    });
    return resolved ? readTsconfigChain(resolved, visiting, files) : [];
  });
  return [...own, ...inherited];
}
function tsconfigPaths(rootDir) {
  for (const name of ["tsconfig.json", "jsconfig.json", "tsconfig.base.json"]) {
    const file = path2.join(rootDir, name);
    if (!isFile(file))
      continue;
    const entries = readTsconfig(file);
    if (entries.length)
      return entries;
  }
  return [];
}
function readTsconfig(file) {
  const cached = tsconfigCache.get(file);
  if (cached?.files.length && signatureOf(cached.files) === cached.signature) {
    return cached.entries;
  }
  tsconfigCache.set(file, { signature: "", files: [], entries: [] });
  const files = [];
  const entries = readTsconfigChain(file, new Set, files);
  tsconfigCache.set(file, { signature: signatureOf(files), files, entries });
  return entries;
}
var packageJsonCache = new Map;
function readPackageJson(dir) {
  const file = path2.join(dir, "package.json");
  const mtimeMs = mtimeOf(file);
  if (mtimeMs === null)
    return null;
  const cached = packageJsonCache.get(file);
  if (cached && cached.mtimeMs === mtimeMs)
    return cached.json;
  const json = readJsonc(file);
  packageJsonCache.set(file, { mtimeMs, json });
  return json;
}
var MAX_CONDITION_DEPTH = 32;
var PREFERRED_CONDITIONS = ["import", "default", "require", "node", "types"];
function pickTarget(value, valid, depth = 0) {
  if (typeof value === "string")
    return valid(value) ? value : null;
  if (depth >= MAX_CONDITION_DEPTH)
    return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const picked = pickTarget(item, valid, depth + 1);
      if (picked)
        return picked;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const key of PREFERRED_CONDITIONS) {
      if (key in value) {
        const picked = pickTarget(value[key], valid, depth + 1);
        if (picked)
          return picked;
      }
    }
    for (const key of Object.keys(value)) {
      if (key.startsWith(".") || PREFERRED_CONDITIONS.includes(key))
        continue;
      const picked = pickTarget(value[key], valid, depth + 1);
      if (picked)
        return picked;
    }
  }
  return null;
}
function mapSubpath(map, subpath, dir, bare = false) {
  const keys = Object.keys(map).filter((key) => key.startsWith(".") || key.startsWith("#")).sort((a, b) => b.length - a.length);
  const out = [];
  for (const key of keys) {
    const captured = matchPattern(key, subpath);
    if (captured === null || !safeSegments(captured))
      continue;
    const target = pickTarget(map[key], (t) => isPackageTarget(t) || bare && isBareTarget(t));
    if (!target)
      continue;
    if (!target.startsWith("./")) {
      out.push({ spec: expand(target, captured) });
      continue;
    }
    const file = packageTarget(dir, target, captured);
    if (file)
      out.push({ file });
  }
  return out;
}
function packageDirectory(name, fromDir) {
  const found = findUp(fromDir, path2.join("node_modules", name));
  return found ? realpath(found) : null;
}
function selfPackageDirectory(name, fromDir) {
  const manifest = findUp(fromDir, "package.json");
  if (!manifest)
    return null;
  const dir = path2.dirname(manifest);
  return readPackageJson(dir)?.name === name ? realpath(dir) : null;
}
function splitPackageSpecifier(spec) {
  const parts = spec.split("/");
  const nameLength = spec.startsWith("@") ? 2 : 1;
  if (parts.length < nameLength)
    return null;
  return {
    name: parts.slice(0, nameLength).join("/"),
    subpath: parts.slice(nameLength).join("/")
  };
}
function candidatesFor(spec, fromDir, rootDir, options = {}) {
  return collectCandidates(spec, fromDir, rootDir, options).filter((candidate) => !isStrayUncPath(candidate, rootDir, fromDir));
}
function collectCandidates(spec, fromDir, rootDir, options) {
  const out = [];
  if (spec.startsWith("./") || spec.startsWith("../") || spec === "." || spec === "..") {
    out.push(path2.resolve(fromDir, spec));
    return out;
  }
  if (path2.isAbsolute(spec)) {
    out.push(spec);
    return out;
  }
  if (!options.skipPaths) {
    for (const entry of tsconfigPaths(rootDir)) {
      const captured = matchPattern(entry.pattern, spec);
      if (captured === null)
        continue;
      for (const target of entry.targets) {
        out.push(path2.resolve(entry.base, expand(target, captured)));
      }
    }
  }
  if (spec.startsWith("#")) {
    const imports = readPackageJson(rootDir)?.imports;
    if (imports && typeof imports === "object") {
      for (const target of mapSubpath(imports, spec, rootDir, true)) {
        if (target.file)
          out.push(target.file);
        else if (target.spec)
          packageCandidates(target.spec, rootDir, out);
      }
      for (const target of mapSubpath(imports, `${spec}/*`, rootDir)) {
        if (target.file)
          out.push(path2.dirname(target.file));
      }
    }
    return out;
  }
  const convention = spec.match(/^[@~]\/(.*)$/);
  if (convention) {
    out.push(path2.join(rootDir, convention[1]));
    out.push(path2.join(rootDir, "src", convention[1]));
    return out;
  }
  const kit = spec.match(/^\$lib(?:\/(.*))?$/);
  if (kit) {
    out.push(path2.join(rootDir, "src/lib", kit[1] ?? ""));
    return out;
  }
  packageCandidates(spec, rootDir, out, fromDir);
  return out;
}
function packageCandidates(spec, rootDir, out, fromDir = rootDir) {
  const pkg = splitPackageSpecifier(spec);
  if (!pkg)
    return;
  const dir = selfPackageDirectory(pkg.name, rootDir) ?? selfPackageDirectory(pkg.name, fromDir) ?? packageDirectory(pkg.name, rootDir) ?? packageDirectory(pkg.name, fromDir);
  if (!dir)
    return;
  const subpath = pkg.subpath ? `./${pkg.subpath}` : ".";
  const exportsMap = readPackageJson(dir)?.exports;
  if (exportsMap && typeof exportsMap === "object") {
    for (const target of mapSubpath(exportsMap, subpath, dir)) {
      if (target.file)
        out.push(target.file);
    }
    for (const target of mapSubpath(exportsMap, `${subpath}/*`, dir)) {
      if (target.file)
        out.push(path2.dirname(target.file));
    }
  }
  const own = pkg.subpath ? [path2.join(dir, pkg.subpath), path2.join(dir, "src", pkg.subpath)] : [dir, path2.join(dir, "src")];
  for (const file of own) {
    if (isInside(dir, file))
      out.push(file);
  }
}
function resolveFileUncached(spec, fromDir, rootDir, extensions = EXTENSIONS, options = {}) {
  for (const candidate of candidatesFor(spec, fromDir, rootDir, options)) {
    if (isFile(candidate))
      return realpath(candidate);
    const ext = path2.extname(candidate);
    for (const source of SOURCE_FOR_JS[ext] ?? []) {
      const swapped = candidate.slice(0, -ext.length) + source;
      if (isFile(swapped))
        return realpath(swapped);
    }
    for (const suffix of extensions) {
      if (isFile(candidate + suffix))
        return realpath(candidate + suffix);
    }
    for (const suffix of extensions) {
      const index = path2.join(candidate, `index${suffix}`);
      if (isFile(index))
        return realpath(index);
    }
  }
  return null;
}
function resolveFile(spec, fromDir, rootDir, extensions = EXTENSIONS, options = {}) {
  const key = `resolve:${fromDir}|${rootDir}|${spec}|${extensions.join(",")}|${options.skipPaths ? 1 : 0}`;
  return memoize(key, () => resolveFileUncached(spec, fromDir, rootDir, extensions, options));
}
function resolveStylesheetImport(base, id) {
  const resolved = resolveStylesheet(base, id);
  if (resolved)
    return realpath(resolved);
  const file = resolveFile(id, base, packageRoot(path3.join(base, "index.css")) ?? base, [".css"]);
  return file && isStylesheet(file) ? file : null;
}
function resolveStylesheet(base, id) {
  if (id === "tailwindcss")
    return resolveStylesheet(base, "tailwindcss/index.css");
  if (id.startsWith(".") || path3.isAbsolute(id)) {
    const file = path3.resolve(base, id);
    if (isStrayUncPath(id, base) || isStrayUncPath(file, base))
      return null;
    return stylesheetAt(path3.dirname(file), path3.basename(id));
  }
  const match = id.match(/^(@[^/]+\/[^/]+|[^/]+)(?:\/(.*))?$/);
  if (!match)
    return null;
  const [, name, subpath] = match;
  const pkgDir = packageDirectory2(base, name);
  if (!pkgDir)
    return null;
  let pkg = {};
  try {
    pkg = JSON.parse(fs3.readFileSync(path3.join(pkgDir, "package.json"), "utf-8"));
  } catch {}
  const exports = pkg.exports;
  if (subpath) {
    const target = exports && typeof exports === "object" ? exportedStyle(pkgDir, exports, subpath) : null;
    if (target)
      return existingFile(target);
    const file = path3.join(pkgDir, subpath);
    if (!isInside(pkgDir, file))
      return null;
    return stylesheetAt(path3.dirname(file), path3.basename(subpath));
  }
  const root = typeof exports === "string" ? exports : exports && typeof exports === "object" ? styleTarget(exports["."] ?? exports) : null;
  const rootFile = root ? packageTarget(pkgDir, root) : null;
  if (rootFile && existingFile(rootFile))
    return rootFile;
  const main = typeof pkg.main === "string" && isStylesheet(pkg.main) ? pkg.main : null;
  for (const target of [pkg.style, main]) {
    if (typeof target !== "string")
      continue;
    const joined = path3.join(pkgDir, target);
    if (!isInside(pkgDir, joined))
      continue;
    const file = existingFile(joined);
    if (file)
      return file;
  }
  return stylesheetAt(pkgDir, "index");
}
function isStylesheet(file) {
  return path3.extname(file).toLowerCase() === ".css";
}
function existingFile(candidate) {
  try {
    return fs3.statSync(candidate).isFile() ? candidate : null;
  } catch {
    return null;
  }
}
function stylesheetAt(dir, name) {
  const base = path3.join(dir, name);
  return existingFile(base) ?? existingFile(`${base}.css`) ?? existingFile(path3.join(base, "index.css"));
}
function styleTarget(entry, depth = 0) {
  if (typeof entry === "string")
    return isPackageTarget(entry) ? entry : null;
  if (!entry || typeof entry !== "object")
    return null;
  if (depth >= MAX_CONDITION_DEPTH)
    return null;
  const record = entry;
  for (const key of ["style", "default"]) {
    const target = styleTarget(record[key], depth + 1);
    if (target)
      return target;
  }
  return null;
}
function exportedStyle(pkgDir, exports, subpath) {
  const exact = styleTarget(exports[`./${subpath}`]);
  if (exact)
    return packageTarget(pkgDir, exact);
  const patterns = Object.keys(exports).filter((key) => key.startsWith("./") && key.includes("*")).sort((a, b) => b.length - a.length);
  for (const key of patterns) {
    const star = key.indexOf("*");
    const prefix = key.slice(2, star);
    const suffix = key.slice(star + 1);
    if (subpath.length < prefix.length + suffix.length || !subpath.startsWith(prefix) || !subpath.endsWith(suffix))
      continue;
    const target = styleTarget(exports[key]);
    if (!target)
      continue;
    const file = packageTarget(pkgDir, target, subpath.slice(prefix.length, subpath.length - suffix.length));
    if (file)
      return file;
  }
  return null;
}
function packageDirectory2(base, name) {
  let dir = base;
  for (let depth = 0;depth < 32; depth++) {
    const candidate = path3.join(dir, "node_modules", name);
    if (existingFile(path3.join(candidate, "package.json")))
      return candidate;
    const parent = path3.dirname(dir);
    if (parent === dir)
      break;
    dir = parent;
  }
  return null;
}
var VARIABLE = String.raw`var\(\s*--[\w-]+\s*\)`;
var ALPHA = String.raw`[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?%?`;
var VARIABLE_CHANNELS = new RegExp(String.raw`(?<![\w-])(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\(\s*${VARIABLE}\s*(?:\/\s*(?:${ALPHA}|${VARIABLE})\s*)?\)`, "gi");
var REM = 16;
function tokenize(input) {
  const tokens = [];
  const re = /\s*(?:(calc\(|\()|(\))|([+\-*/])|(\d*\.?\d+(?:e[+-]?\d+)?)(px|rem|em|%)?)/giy;
  let last = 0;
  let match;
  while (last < input.length) {
    re.lastIndex = last;
    match = re.exec(input);
    if (!match || match[0].length === 0) {
      return /^\s*$/.test(input.slice(last)) ? tokens : null;
    }
    last = re.lastIndex;
    if (match[1])
      tokens.push({ kind: "(" });
    else if (match[2])
      tokens.push({ kind: ")" });
    else if (match[3])
      tokens.push({ kind: "op", op: match[3] });
    else {
      const number = Number(match[4]);
      const unit = (match[5] ?? "").toLowerCase();
      if (unit === "%")
        return null;
      const value = unit === "px" ? { px: number } : unit === "rem" || unit === "em" ? { px: number * REM } : { n: number };
      tokens.push({ kind: "num", value });
    }
  }
  return tokens;
}
function add(a, b, sign) {
  if ("px" in a && "px" in b)
    return { px: a.px + sign * b.px };
  if ("n" in a && "n" in b)
    return { n: a.n + sign * b.n };
  if ("n" in a && a.n === 0 && "px" in b)
    return { px: sign * b.px };
  if ("px" in a && "n" in b && b.n === 0)
    return a;
  return null;
}
function multiply(a, b) {
  if ("n" in a && "n" in b)
    return { n: a.n * b.n };
  if ("px" in a && "n" in b)
    return { px: a.px * b.n };
  if ("n" in a && "px" in b)
    return { px: a.n * b.px };
  return null;
}
function divide(a, b) {
  if (!("n" in b) || b.n === 0)
    return null;
  return "px" in a ? { px: a.px / b.n } : { n: a.n / b.n };
}
function evaluate(tokens) {
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];
  const factor = () => {
    const token = next();
    if (!token)
      return null;
    if (token.kind === "num")
      return token.value;
    if (token.kind === "op" && token.op === "-") {
      const inner = factor();
      return inner && ("px" in inner ? { px: -inner.px } : { n: -inner.n });
    }
    if (token.kind === "op" && token.op === "+")
      return factor();
    if (token.kind === "(") {
      const inner = sum();
      const close = next();
      return close?.kind === ")" ? inner : null;
    }
    return null;
  };
  const product = () => {
    let left = factor();
    while (left) {
      const token = peek();
      if (token?.kind !== "op" || token.op !== "*" && token.op !== "/")
        break;
      next();
      const right = factor();
      if (!right)
        return null;
      left = token.op === "*" ? multiply(left, right) : divide(left, right);
    }
    return left;
  };
  const sum = () => {
    let left = product();
    while (left) {
      const token = peek();
      if (token?.kind !== "op" || token.op !== "+" && token.op !== "-")
        break;
      next();
      const right = product();
      if (!right)
        return null;
      left = add(left, right, token.op === "+" ? 1 : -1);
    }
    return left;
  };
  const result = sum();
  return i === tokens.length ? result : null;
}
function lengthInPx(value) {
  const tokens = tokenize(value.trim());
  if (!tokens || !tokens.length)
    return null;
  const result = evaluate(tokens);
  if (!result)
    return null;
  if ("px" in result)
    return result.px;
  return result.n === 0 ? 0 : null;
}
var FONT_SIZES = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
  "6xl": "3.75rem",
  "7xl": "4.5rem",
  "8xl": "6rem",
  "9xl": "8rem",
  "shadow-2xs": "0px 1px 0px rgb(0 0 0 / 0.15)",
  "shadow-xs": "0px 1px 1px rgb(0 0 0 / 0.2)",
  "shadow-sm": "0px 1px 0px rgb(0 0 0 / 0.075), 0px 1px 1px rgb(0 0 0 / 0.075), 0px 2px 2px rgb(0 0 0 / 0.075)",
  "shadow-md": "0px 1px 1px rgb(0 0 0 / 0.1), 0px 1px 2px rgb(0 0 0 / 0.1), 0px 2px 4px rgb(0 0 0 / 0.1)",
  "shadow-lg": "0px 1px 2px rgb(0 0 0 / 0.1), 0px 3px 2px rgb(0 0 0 / 0.1), 0px 4px 8px rgb(0 0 0 / 0.1)"
};
var RADII = {
  xs: "0.125rem",
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  "4xl": "2rem"
};
var seen = new Set;
var cache = new Map;
var cache2 = new Map;
function stripComments(css) {
  const parts = [];
  let start = 0;
  let i = 0;
  while (i < css.length) {
    const char = css[i];
    if (char === "/" && css[i + 1] === "*") {
      parts.push(css.slice(start, i));
      const end = css.indexOf("*/", i + 2);
      i = end === -1 ? css.length : end + 2;
      start = i;
    } else if (char === '"' || char === "'") {
      i++;
      while (i < css.length && css[i] !== char) {
        i += css[i] === "\\" ? 2 : 1;
      }
      i++;
    } else if (css.startsWith("url(", i)) {
      const end = css.indexOf(")", i + 4);
      i = end === -1 ? css.length : end + 1;
    } else {
      i++;
    }
  }
  parts.push(css.slice(start));
  return parts.join("");
}
var IMPORT_HEAD = /@import\s+(?:url\(\s*)?["']([^"']+)["']/g;
function parseImports(css) {
  const out = [];
  const text = stripComments(css);
  const re = new RegExp(IMPORT_HEAD);
  for (let match = re.exec(text);match; match = re.exec(text)) {
    const end = text.indexOf(";", re.lastIndex);
    if (end === -1)
      break;
    out.push(match[1]);
    re.lastIndex = end + 1;
  }
  return out;
}
var themeImports = new Map;
var SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  "public",
  ".next",
  ".git",
  ".turbo",
  ".registry"
]);
var discovered = new Map;
var SCALE_DEFAULTS = {
  radius: RADII,
  text: FONT_SIZES
};
function defaultScale(kind) {
  const scale = new Map;
  for (const [name, value] of Object.entries(SCALE_DEFAULTS[kind])) {
    const px = lengthInPx(value);
    if (px !== null)
      scale.set(name, px);
  }
  return scale;
}
var DEFAULT_SCALES = {
  radius: defaultScale("radius"),
  text: defaultScale("text")
};
var utilityPrefixes = new WeakMap;
var NO_CLASSES = {
  utilities: new Map,
  classes: new Set
};
var SIGNATURE_TTL = 1000;
var FONT_SIZE = /(?:^|[;{\s])font-size\s*:/;
var MAX_CANDIDATE_LENGTH = 1e4;
var MAX_VARIANTS = 64;
var loaded = new Map;
var generations = 0;
function resolveFrom(base, id) {
  return createRequire(path6.join(base, "noop.js")).resolve(id);
}
function* tailwindImporters(cssFile) {
  const seen = new Set;
  const queue = [cssFile];
  while (queue.length) {
    const file = queue.shift();
    if (seen.has(file))
      continue;
    seen.add(file);
    let css;
    try {
      css = fs5.readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    for (const id of parseImports(css)) {
      if (id === "tailwindcss" || id.startsWith("tailwindcss/")) {
        yield path6.dirname(file);
        continue;
      }
      const resolved = resolveStylesheetImport(path6.dirname(file), id);
      if (resolved)
        queue.push(realpathOf(resolved));
    }
  }
}
function* tailwindBases(cssFile) {
  yield path6.dirname(cssFile);
  yield* tailwindImporters(cssFile);
  yield process.cwd();
}
async function loadTailwind(cssFile) {
  for (const from of tailwindBases(cssFile)) {
    let resolved;
    try {
      resolved = resolveFrom(from, "tailwindcss");
    } catch {
      continue;
    }
    const mod = await import(pathToFileURL(resolved).href);
    const api = typeof mod.__unstable__loadDesignSystem === "function" ? mod : typeof mod.default?.__unstable__loadDesignSystem === "function" ? mod.default : null;
    if (api)
      return { api, resolved };
    throw new Error(`${resolved} is not Tailwind v4 (no __unstable__loadDesignSystem)`);
  }
  return null;
}
async function loadNodeLoader(cssFile, tailwind) {
  const bases = [...tailwindBases(cssFile), path6.dirname(realpathOf(tailwind))];
  for (const from of bases) {
    let resolved;
    try {
      resolved = resolveFrom(from, "@tailwindcss/node");
    } catch {
      continue;
    }
    try {
      const mod = await import(pathToFileURL(resolved).href);
      const loader = mod.loadModule ?? mod.default?.loadModule;
      if (typeof loader === "function")
        return loader;
    } catch {}
  }
  return null;
}
async function importModule(id, base) {
  const resolved = resolveFrom(base, id);
  const url = pathToFileURL(resolved);
  url.searchParams.set("mtime", String(mtimeOf2(resolved)));
  const mod = await import(url.href);
  return {
    path: resolved,
    base: path6.dirname(resolved),
    module: mod.default ?? mod
  };
}
function realpathOf(file) {
  try {
    return fs5.realpathSync.native(file);
  } catch {
    return file;
  }
}
function mtimeOf2(file) {
  try {
    return fs5.statSync(file).mtimeMs;
  } catch {
    return null;
  }
}
function signatureOf3(files) {
  return files.map((file) => `${file}:${mtimeOf2(file) ?? "missing"}`).join("|");
}
async function build(cssFile) {
  const dir = path6.dirname(cssFile);
  const tailwind = await loadTailwind(cssFile);
  if (!tailwind) {
    throw new Error(`tailwindcss v4 could not be resolved from ${dir}`);
  }
  let loader;
  const files = [cssFile];
  let modules = 0;
  const css = fs5.readFileSync(cssFile, "utf-8");
  const ds = await tailwind.api.__unstable__loadDesignSystem(css, {
    base: dir,
    async loadStylesheet(id, base) {
      if (/^(?:https?:|data:)/.test(id))
        return { base, content: "" };
      const resolved = resolveStylesheetImport(base, id);
      if (!resolved) {
        throw new Error(`@import "${id}" could not be resolved from ${base}`);
      }
      const file = realpathOf(resolved);
      files.push(file);
      return {
        base: path6.dirname(file),
        content: fs5.readFileSync(file, "utf-8")
      };
    },
    async loadModule(id, base) {
      modules++;
      if (loader === undefined) {
        loader = await loadNodeLoader(cssFile, tailwind.resolved);
      }
      const result = loader ? await loader(id, base, (file) => files.push(file)) : await importModule(id, base);
      files.push(result.path);
      return { base: result.base, module: result.module };
    }
  });
  const variants = ds.getVariants();
  return {
    ds,
    files,
    modules,
    prefix: ds.theme?.prefix ?? null,
    signature: signatureOf3(files),
    checkedAt: Date.now(),
    generation: ++generations,
    classNames: null,
    staticVariants: variants.filter((v) => !v.isArbitrary && !v.values.length).map((v) => v.name),
    functionalVariants: variants.filter((v) => v.isArbitrary || v.values.length).map((v) => v.name)
  };
}
async function designSystemFor(cssFile) {
  const cached = loaded.get(cssFile);
  const now = Date.now();
  if (cached) {
    if (now - cached.checkedAt < SIGNATURE_TTL)
      return cached;
    if (signatureOf3(cached.files) === cached.signature) {
      cached.checkedAt = now;
      return cached;
    }
  }
  const fresh = await build(cssFile);
  loaded.set(cssFile, fresh);
  return fresh;
}
function classNamesOf(system) {
  if (!system.classNames) {
    system.classNames = system.ds.getClassList().map((entry) => Array.isArray(entry) ? entry[0] : entry);
  }
  return system.classNames;
}
function variantKnown(system, variant) {
  const name = variant.replace(/\/.*$/, "");
  if (name.startsWith("[") || name.startsWith("@"))
    return true;
  if (system.staticVariants.includes(name))
    return true;
  return system.functionalVariants.some((prefix) => name === prefix || name.startsWith(`${prefix}-`));
}
function checkable(candidate) {
  return candidate.length <= MAX_CANDIDATE_LENGTH && splitVariants(candidate).variants.length <= MAX_VARIANTS;
}
function cssOf(system, candidate) {
  try {
    return system.ds.candidatesToCss([candidate])[0];
  } catch {
    return;
  }
}
function cssOfAll(system, candidates) {
  try {
    return system.ds.candidatesToCss(candidates);
  } catch {
    return candidates.map((candidate) => cssOf(system, candidate));
  }
}
function suggestionFor(system, candidate) {
  const { variants, base } = splitVariants(candidate);
  const prefixed = system.prefix !== null && variants[0] === system.prefix;
  const probe = prefixed ? `${system.prefix}:${base}` : base;
  if (variants.length && typeof cssOf(system, probe) === "string") {
    let changed = false;
    const fixed = variants.map((variant, i) => {
      if (prefixed && i === 0)
        return variant;
      if (variantKnown(system, variant))
        return variant;
      const meant = didYouMean(variant, system.staticVariants, 1);
      if (!meant)
        return variant;
      changed = true;
      return meant;
    });
    return changed ? [...fixed, base].join(":") : null;
  }
  const bare = base.replace(/^!/, "").replace(/!$/, "").replace(/^-/, "");
  const meant = didYouMean(bare, classNamesOf(system));
  if (!meant)
    return null;
  const rebuilt = base.replace(bare, meant);
  return [...variants, rebuilt].join(":");
}
function baseKnownOf(system, candidate) {
  const { variants, base } = splitVariants(candidate);
  if (!variants.length)
    return false;
  const bare = system.prefix && variants[0] === system.prefix ? `${system.prefix}:${base}` : base;
  if (variants.length === (bare === base ? 0 : 1))
    return false;
  return typeof cssOf(system, bare) === "string";
}
async function query(cssFile, candidates) {
  let system;
  try {
    system = await designSystemFor(cssFile);
  } catch (error) {
    return { ok: false, reason: error.message };
  }
  const checked = candidates.filter(checkable);
  const css = cssOfAll(system, checked);
  const unknown = [];
  const fontSizes = [];
  for (let i = 0;i < checked.length; i++) {
    if (css[i] === undefined)
      continue;
    if (css[i] !== null) {
      if (FONT_SIZE.test(css[i]))
        fontSizes.push(checked[i]);
      continue;
    }
    unknown.push({
      token: checked[i],
      suggestion: suggestionFor(system, checked[i]),
      baseKnown: baseKnownOf(system, checked[i])
    });
  }
  return {
    ok: true,
    generation: system.generation,
    hasModules: system.modules > 0,
    unknown,
    fontSizes
  };
}
var port = workerData.port;
port.on("message", async ({ id, cssFile, candidates, shared }) => {
  let answer;
  try {
    answer = await query(cssFile, candidates);
  } catch (error) {
    answer = { ok: false, reason: error.message };
  }
  port.postMessage({ id, answer });
  const flag = new Int32Array(shared);
  Atomics.store(flag, 0, 1);
  Atomics.notify(flag, 0);
});
