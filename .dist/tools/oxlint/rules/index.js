import {
  loadTsConfigAliases
} from "../../../chunk-qa5a0367.js";

// node_modules/@oxlint/plugins/index.js
function definePlugin(plugin) {
  return plugin;
}
function defineRule(rule) {
  return rule;
}
var FILE_CONTEXT = Object.freeze({
  get filename() {
    throw Error("Cannot access `context.filename` in `createOnce`");
  },
  getFilename() {
    throw Error("Cannot call `context.getFilename` in `createOnce`");
  },
  get physicalFilename() {
    throw Error("Cannot access `context.physicalFilename` in `createOnce`");
  },
  getPhysicalFilename() {
    throw Error("Cannot call `context.getPhysicalFilename` in `createOnce`");
  },
  get cwd() {
    throw Error("Cannot access `context.cwd` in `createOnce`");
  },
  getCwd() {
    throw Error("Cannot call `context.getCwd` in `createOnce`");
  },
  get sourceCode() {
    throw Error("Cannot access `context.sourceCode` in `createOnce`");
  },
  getSourceCode() {
    throw Error("Cannot call `context.getSourceCode` in `createOnce`");
  },
  get languageOptions() {
    throw Error("Cannot access `context.languageOptions` in `createOnce`");
  },
  get settings() {
    throw Error("Cannot access `context.settings` in `createOnce`");
  },
  extend(extension) {
    return Object.freeze(Object.assign(Object.create(this), extension));
  },
  get parserOptions() {
    throw Error("Cannot access `context.parserOptions` in `createOnce`");
  },
  get parserPath() {
    throw Error("Cannot access `context.parserPath` in `createOnce`");
  }
});

// tools/oxlint/rules/canonical-header-names/index.ts
var headerWordCasing = new Map([
  ["ct", "CT"],
  ["dpop", "DPoP"],
  ["etag", "ETag"],
  ["te", "TE"],
  ["www", "WWW"],
  ["x", "X"],
  ["xss", "XSS"]
]);
var headerNamePattern = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/u;
var headerMethods = new Set(["append", "delete", "get", "has", "set"]);
function canonicalHeaderName(name) {
  return name.toLowerCase().split("-").map((word) => headerWordCasing.get(word) ?? word.charAt(0).toUpperCase() + word.slice(1)).join("-");
}
function isStringLiteral(node) {
  return node.type === "Literal" && typeof node.value === "string";
}
function isStaticMemberExpression(node) {
  return node.type === "MemberExpression" && !node.computed && node.property.type === "Identifier";
}
function isIdentifierReference(node) {
  return node.type === "Identifier";
}
function isHeadersIdentifierName(name) {
  return name === "headers" || name.endsWith("Headers");
}
function isNewHeadersExpression(node) {
  return node.type === "NewExpression" && isIdentifierReference(node.callee) && node.callee.name === "Headers";
}
function isLikelyHeadersReceiver(node) {
  if (isIdentifierReference(node)) {
    return isHeadersIdentifierName(node.name);
  }
  if (isStaticMemberExpression(node)) {
    return node.property.name === "headers";
  }
  return isNewHeadersExpression(node);
}
function quoteLike(raw, value) {
  const quote = raw?.startsWith('"') ? '"' : "'";
  const escaped = value.replaceAll("\\", "\\\\").replaceAll(quote, `\\${quote}`);
  return `${quote}${escaped}${quote}`;
}
function getStaticPropertyName(node) {
  if (node.computed) {
    return null;
  }
  if (node.key.type === "Identifier") {
    return node.key.name;
  }
  if (node.key.type === "Literal" && isStringLiteral(node.key)) {
    return node.key.value;
  }
  return null;
}
function getHeaderPropertyKeyFixText(node, canonicalName) {
  if (node.type === "Literal") {
    return quoteLike(node.raw, canonicalName);
  }
  return canonicalName;
}
function isHeaderPropertyKey(node) {
  return node.type === "Identifier" || node.type === "Literal" && typeof node.value === "string";
}
function reportHeaderName(context, node, name) {
  if (!headerNamePattern.test(name)) {
    return;
  }
  const canonicalName = canonicalHeaderName(name);
  if (name === canonicalName) {
    return;
  }
  context.report({
    node,
    message: `Use canonical HTTP header name '${canonicalName}'.`,
    fix(fixer) {
      return fixer.replaceText(node, getHeaderPropertyKeyFixText(node, canonicalName));
    }
  });
}
function checkHeadersInitObject(context, node) {
  for (const property of node.properties) {
    if (property.type !== "Property") {
      continue;
    }
    const headerName = getStaticPropertyName(property);
    if (headerName === null) {
      continue;
    }
    if (!isHeaderPropertyKey(property.key)) {
      continue;
    }
    reportHeaderName(context, property.key, headerName);
  }
}
function isHeadersInitPropertyValue(node) {
  const { parent } = node;
  if (parent.type !== "Property" || parent.value !== node) {
    return false;
  }
  return getStaticPropertyName(parent) === "headers";
}
var canonicalHeaderNames = defineRule({
  meta: {
    type: "suggestion",
    fixable: "code"
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isStaticMemberExpression(node.callee)) {
          return;
        }
        const methodName = node.callee.property.name;
        if (!headerMethods.has(methodName)) {
          return;
        }
        if (!isLikelyHeadersReceiver(node.callee.object)) {
          return;
        }
        const [headerName] = node.arguments;
        if (!headerName || !isStringLiteral(headerName)) {
          return;
        }
        reportHeaderName(context, headerName, headerName.value);
      },
      NewExpression(node) {
        if (!isNewHeadersExpression(node)) {
          return;
        }
        const [headersInit] = node.arguments;
        if (headersInit?.type !== "ObjectExpression") {
          return;
        }
        checkHeadersInitObject(context, headersInit);
      },
      ObjectExpression(node) {
        if (!isHeadersInitPropertyValue(node)) {
          return;
        }
        checkHeadersInitObject(context, node);
      }
    };
  }
});

// tools/oxlint/rules/interface-pascal-case/index.ts
var pascalCasePattern = /^[A-Z][A-Za-z0-9]*$/u;
function toPascalCase(name) {
  return name.replaceAll(/(?<lower>[a-z0-9])(?<upper>[A-Z])/gu, "$<lower> $<upper>").split(/[\s_-]+/u).filter((word) => word.length > 0).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
}
function isExported(node) {
  return node.parent?.type === "ExportNamedDeclaration";
}
function renameFix(context, node, newName) {
  if (isExported(node))
    return;
  try {
    const [variable] = context.sourceCode.getDeclaredVariables(node);
    if (!variable)
      return;
    return (fixer) => [
      ...variable.defs.map((definition) => fixer.replaceText(definition.name, newName)),
      ...variable.references.map((reference) => fixer.replaceText(reference.identifier, newName))
    ];
  } catch {
    return;
  }
}
var interfacePascalCase = defineRule({
  meta: {
    fixable: "code",
    messages: {
      interface: "Unexpected interface name {{name}}. Use {{newName}} instead",
      exported: "Unexpected interface name {{name}}. Use {{newName}} instead. It is exported, so rename its usages in every file manually; no autofix is available",
      pascalCase: "Interface name {{name}} must use PascalCase"
    },
    type: "suggestion"
  },
  create(context) {
    return {
      TSInterfaceDeclaration(node) {
        const { name } = node.id;
        if (pascalCasePattern.test(name)) {
          return;
        }
        const newName = toPascalCase(name);
        const renameable = newName !== name && pascalCasePattern.test(newName);
        const exported = renameable && isExported(node);
        const fixable = renameable && !exported;
        let messageId = "pascalCase";
        if (fixable) {
          messageId = "interface";
        } else if (exported) {
          messageId = "exported";
        }
        context.report({
          data: { name, newName },
          fix: fixable ? renameFix(context, node, newName) : undefined,
          messageId,
          node: node.id
        });
      }
    };
  }
});

// tools/oxlint/rules/no-ts-accessibility/index.ts
function findAccessibilityRange(context, node, accessibility) {
  const text = context.sourceCode.text.slice(node.range[0]);
  const offset = text.search(new RegExp(`\\b${accessibility}\\b`, "u"));
  const start = node.range[0] + Math.max(offset, 0);
  return [start, start + accessibility.length];
}
function removeAccessibilityFix(context, node) {
  const { accessibility } = node;
  if (!accessibility)
    return;
  const [start, end] = findAccessibilityRange(context, node, accessibility);
  const trailing = context.sourceCode.text.charAt(end) === " " ? end + 1 : end;
  return (fixer) => fixer.replaceTextRange([start, trailing], "");
}
var noTypescriptAccessibility = defineRule({
  meta: {
    fixable: "code",
    type: "problem"
  },
  create(context) {
    return {
      PropertyDefinition(node) {
        if (node.accessibility == null) {
          return;
        }
        context.report({
          fix: node.accessibility === "public" ? removeAccessibilityFix(context, node) : undefined,
          message: "Use native class fields: omit 'public' and use '#private' for private state.",
          node
        });
      },
      MethodDefinition(node) {
        if (node.accessibility == null) {
          return;
        }
        if (node.kind !== "constructor") {
          context.report({
            node,
            fix: node.accessibility === "public" ? removeAccessibilityFix(context, node) : undefined,
            message: "Use native methods: omit 'public'; for private behavior use '#private' fields/methods."
          });
          return;
        }
        if (node.accessibility === "public") {
          context.report({
            fix: removeAccessibilityFix(context, node),
            message: "Omit 'public' on constructors; it's the default.",
            node
          });
        }
      },
      TSParameterProperty(node) {
        if (node.accessibility == null) {
          return;
        }
        context.report({
          node,
          message: "Avoid TS parameter properties; declare fields explicitly and use '#private' when needed."
        });
      }
    };
  }
});

// tools/oxlint/rules/prefer-alias/rule.ts
import fs from "node:fs";
import path from "node:path";
function splitSpecifierSuffix(specifier) {
  const index = specifier.search(/[?#]/u);
  return index === -1 ? { path: specifier, suffix: "" } : { path: specifier.slice(0, index), suffix: specifier.slice(index) };
}
var moduleExtensions = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json"
];
var fileCheckCache = new Map;
function isFile(absolutePath) {
  const cached = fileCheckCache.get(absolutePath);
  if (cached !== undefined)
    return cached;
  let exists;
  try {
    exists = fs.statSync(absolutePath).isFile();
  } catch {
    exists = false;
  }
  fileCheckCache.set(absolutePath, exists);
  return exists;
}
var missProbes = new Map;
var resolutionCache = new Map;
function directoryStamp(directory) {
  try {
    return fs.readdirSync(directory).length;
  } catch {
    return -1;
  }
}
function forgetResolution(absolutePath) {
  resolutionCache.delete(absolutePath);
  missProbes.delete(absolutePath);
  fileCheckCache.delete(absolutePath);
  for (const extension of moduleExtensions) {
    fileCheckCache.delete(`${absolutePath}${extension}`);
    fileCheckCache.delete(path.join(absolutePath, `index${extension}`));
  }
}
function hasFreshlyAppeared(absolutePath) {
  const probes = missProbes.get(absolutePath);
  if (!probes)
    return true;
  return ![...probes].every(([directory, stamp]) => directoryStamp(directory) === stamp);
}
function resolveModulePath(absolutePath) {
  const cached = resolutionCache.get(absolutePath);
  if (cached !== undefined) {
    if (cached !== null || !hasFreshlyAppeared(absolutePath))
      return cached;
    forgetResolution(absolutePath);
  }
  const probed = new Map;
  const probe = (candidate) => {
    const directory = path.dirname(candidate);
    if (!probed.has(directory))
      probed.set(directory, directoryStamp(directory));
    return isFile(candidate);
  };
  const candidates = [
    absolutePath,
    ...moduleExtensions.map((extension) => `${absolutePath}${extension}`)
  ];
  let resolved = candidates.find(probe) ?? null;
  if (!resolved)
    resolved = moduleExtensions.map((extension) => path.join(absolutePath, `index${extension}`)).find(probe) ?? null;
  if (resolved === null)
    missProbes.set(absolutePath, probed);
  resolutionCache.set(absolutePath, resolved);
  return resolved;
}
function capturePathRemainder(rawAbsolutePath, basePath, pathPattern) {
  const absolutePath = path.normalize(rawAbsolutePath);
  const wildcardIndex = pathPattern.indexOf("*");
  if (wildcardIndex === -1)
    return absolutePath === path.resolve(basePath, pathPattern) ? "" : null;
  const head = pathPattern.slice(0, wildcardIndex);
  const tail = pathPattern.slice(wildcardIndex + 1);
  const resolvedHead = path.normalize(path.resolve(basePath, head));
  const prefix = resolvedHead.endsWith(path.sep) ? resolvedHead : `${resolvedHead}${path.sep}`;
  if (!absolutePath.startsWith(prefix))
    return null;
  let remainder = absolutePath.slice(prefix.length);
  if (tail) {
    if (!remainder.endsWith(tail) || remainder.length === tail.length)
      return null;
    remainder = remainder.slice(0, remainder.length - tail.length);
  }
  return remainder.replaceAll(path.sep, "/");
}
function collectAliasCandidates(absolutePath, basePath, aliasPatterns) {
  const candidates = [];
  for (const [aliasPattern, pathPatterns] of Object.entries(aliasPatterns)) {
    const aliasWildcard = aliasPattern.indexOf("*");
    for (const pathPattern of pathPatterns) {
      const remainder = capturePathRemainder(absolutePath, basePath, pathPattern);
      if (remainder === null)
        continue;
      if (aliasWildcard === -1) {
        if (remainder === "")
          candidates.push(aliasPattern);
        continue;
      }
      candidates.push(aliasPattern.slice(0, aliasWildcard) + remainder);
    }
  }
  return candidates;
}
function findBestAliasMatch(absolutePath, basePath, aliasPatterns) {
  const candidates = collectAliasCandidates(absolutePath, basePath, aliasPatterns);
  let shortest = null;
  for (const candidate of candidates)
    if (shortest === null || candidate.length < shortest.length)
      shortest = candidate;
  return shortest;
}
function findAliasTarget(importPath, basePath, aliasPatterns) {
  const candidates = [];
  for (const [aliasPattern, pathPatterns] of Object.entries(aliasPatterns)) {
    const aliasWildcard = aliasPattern.indexOf("*");
    if (aliasWildcard === -1) {
      if (importPath === aliasPattern) {
        const [pathPattern] = pathPatterns;
        if (pathPattern)
          candidates.push(path.resolve(basePath, pathPattern));
      }
      continue;
    }
    const aliasBase = aliasPattern.slice(0, aliasWildcard);
    if (!importPath.startsWith(aliasBase))
      continue;
    const remainder = importPath.slice(aliasBase.length);
    for (const pathPattern of pathPatterns) {
      const pathWildcardIndex = pathPattern.indexOf("*");
      if (pathWildcardIndex === -1)
        continue;
      candidates.push(path.resolve(basePath, `${pathPattern.slice(0, pathWildcardIndex)}${remainder}${pathPattern.slice(pathWildcardIndex + 1)}`));
    }
  }
  if (candidates.length === 0)
    return null;
  return candidates.find((candidate) => resolveModulePath(candidate)) ?? candidates[0] ?? null;
}
function matchesAliasPattern(importPath, aliasPatterns) {
  for (const aliasPattern of Object.keys(aliasPatterns)) {
    const wildcardIndex = aliasPattern.indexOf("*");
    if (wildcardIndex === -1) {
      if (importPath === aliasPattern)
        return true;
      continue;
    }
    const head = aliasPattern.slice(0, wildcardIndex);
    const tail = aliasPattern.slice(wildcardIndex + 1);
    if (tail) {
      if (importPath.endsWith(tail) && importPath.length >= head.length + tail.length)
        return true;
      continue;
    }
    if (importPath.startsWith(head) && importPath.length > head.length)
      return true;
  }
  return false;
}
var installedPackageCache = new Map;
function pathExists(absolutePath) {
  try {
    fs.statSync(absolutePath);
    return true;
  } catch {
    return false;
  }
}
function isRelativeImport(importPath) {
  return ["./", "../"].some((prefix) => importPath.startsWith(prefix)) || importPath === "." || importPath === "..";
}
function packageNameOf(importPath) {
  if (importPath === "." || importPath === ".." || isRelativeImport(importPath))
    return null;
  const segments = importPath.split("/");
  const [first] = segments;
  if (first === undefined || first === "")
    return null;
  if (first.includes(":"))
    return null;
  return first.startsWith("@") ? segments.slice(0, 2).join("/") : first;
}
function isInstalledPackage(importPath, cwd, exists = pathExists) {
  const packageName = packageNameOf(importPath);
  if (!packageName)
    return false;
  const cacheKey = `${cwd}
${packageName}`;
  const cached = installedPackageCache.get(cacheKey);
  if (cached !== undefined)
    return cached;
  const installed = exists(path.join(cwd, "node_modules", packageName));
  installedPackageCache.set(cacheKey, installed);
  return installed;
}
function installedPackageOf(importPath, cwd, exists = pathExists) {
  const packageName = packageNameOf(importPath);
  return packageName && isInstalledPackage(importPath, cwd, exists) ? packageName : null;
}
function isSameDirectory(absolutePath, directory) {
  return path.dirname(absolutePath) === directory;
}
function toRelativeImport(importerDirectory, absolutePath) {
  const relativePath = path.relative(importerDirectory, absolutePath).replaceAll(path.sep, "/");
  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
}
function preserveExtensionOmission(original, suggested) {
  const { path: originalPath, suffix } = splitSpecifierSuffix(original);
  const extension = /\.[^./]+$/u.exec(suggested)?.[0] ?? "";
  const kept = extension !== "" && !originalPath.endsWith(extension) ? suggested.slice(0, -extension.length) : suggested;
  return `${kept}${suffix}`;
}
function isStringEntry(value) {
  return typeof value === "string";
}
function isStringArray(value) {
  return Array.isArray(value) && value.every(isStringEntry);
}
function isOptionObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseOptionsAlias(options) {
  const option = options.find(isOptionObject);
  const alias = option?.alias;
  const parsed = {};
  if (!isOptionObject(alias))
    return parsed;
  for (const [key, value] of Object.entries(alias)) {
    if (isStringEntry(value)) {
      parsed[key] = [value];
      continue;
    }
    if (isStringArray(value) && value.length > 0)
      parsed[key] = value;
  }
  return parsed;
}
var aliasConfigCache = new Map;
function loadAliasConfig(cwd, options) {
  const key = `${cwd}
${JSON.stringify(options)}`;
  const loaded = loadTsConfigAliases(cwd);
  const patterns = Object.entries(loaded.aliasPatterns).flatMap(([alias, targets]) => [
    alias,
    ...targets
  ]);
  const cached = aliasConfigCache.get(key);
  if (cached && cached.patterns.join(`
`) === patterns.join(`
`))
    return cached.config;
  const config = {
    aliasPatterns: { ...loaded.aliasPatterns, ...parseOptionsAlias(options) },
    basePath: loaded.basePath || cwd
  };
  aliasConfigCache.set(key, { config, patterns });
  return config;
}
function findShorterAlias(absolutePath, basePath, aliasPatterns, currentSpelling) {
  const match = findBestAliasMatch(absolutePath, basePath, aliasPatterns);
  if (!match || match === currentSpelling)
    return null;
  return preserveExtensionOmission(currentSpelling, match).length < currentSpelling.length ? match : null;
}
function hasStaticModuleSpecifier(node) {
  return node.type === "ImportDeclaration" || node.type === "ExportNamedDeclaration" || node.type === "ExportAllDeclaration";
}
var preferAlias = defineRule({
  createOnce: (context) => {
    const checkModuleSpecifier = (node) => {
      if (!hasStaticModuleSpecifier(node))
        return;
      const { source } = node;
      if (!source)
        return;
      const { aliasPatterns, basePath } = loadAliasConfig(context.cwd, context.options);
      if (Object.keys(aliasPatterns).length === 0)
        return;
      const importPath = source.value;
      const { path: bareSpecifier, suffix } = splitSpecifierSuffix(importPath);
      const importerDirectory = path.dirname(context.filename);
      const relativeImport = isRelativeImport(bareSpecifier);
      const absoluteImport = relativeImport ? resolveModulePath(path.resolve(importerDirectory, bareSpecifier)) ?? path.resolve(importerDirectory, bareSpecifier) : findAliasTarget(bareSpecifier, basePath, aliasPatterns);
      if (!absoluteImport)
        return;
      const report = (candidate, messageId) => {
        const newPath = preserveExtensionOmission(importPath, candidate);
        if (suffix !== "" && newPath === importPath)
          return;
        context.report({
          data: { newPath, path: importPath },
          fix: (fixer) => fixer.replaceTextRange([source.range[0] + 1, source.range[1] - 1], newPath),
          messageId,
          node
        });
      };
      const preferSiblingOrShorter = (target, messageId) => {
        if (isSameDirectory(target, importerDirectory)) {
          const relative = toRelativeImport(importerDirectory, target);
          if (preserveExtensionOmission(importPath, relative) === importPath)
            return false;
          report(relative, "import");
          return true;
        }
        const match = findShorterAlias(target, basePath, aliasPatterns, importPath);
        if (!match)
          return false;
        report(match, messageId);
        return true;
      };
      if (!relativeImport) {
        const installedPackage = installedPackageOf(bareSpecifier, context.cwd);
        if (installedPackage) {
          if (!matchesAliasPattern(bareSpecifier, aliasPatterns))
            return;
          if (bareSpecifier.length <= installedPackage.length)
            return;
        } else if (!matchesAliasPattern(bareSpecifier, aliasPatterns))
          return;
        preferSiblingOrShorter(absoluteImport, "shortAlias");
        return;
      }
      preferSiblingOrShorter(absoluteImport, "import");
    };
    return {
      ImportDeclaration: checkModuleSpecifier,
      ExportAllDeclaration: checkModuleSpecifier,
      ExportNamedDeclaration: checkModuleSpecifier
    };
  },
  meta: {
    defaultOptions: [{}],
    fixable: "code",
    messages: {
      import: "Unexpected import {{path}}. Use {{newPath}} instead",
      shortAlias: "Prefer importing {{newPath}} over {{path}}"
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          alias: {
            description: "Optional map of additional aliases (overrides tsconfig.json if provided). Can be string or array of strings.",
            type: "object"
          }
        },
        type: "object"
      }
    ],
    hasSuggestions: true,
    type: "suggestion"
  }
});

// tools/oxlint/rules/index.ts
var plugin = definePlugin({
  meta: { name: "lazuee" },
  rules: {
    "prefer-alias": preferAlias,
    "no-ts-accessibility": noTypescriptAccessibility,
    "interface-pascal-case": interfacePascalCase,
    "canonical-header-names": canonicalHeaderNames
  }
});
var rules_default = plugin;
export {
  rules_default as default
};
