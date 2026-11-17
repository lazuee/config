// tools/oxlint/config/vendors/no-comment-slop.ts
var DIRECTIVE = new RegExp([
  /^\s*@ts-(?:ignore|expect-error|nocheck|check)/,
  /^\s*@(?:type|typedef|satisfies|license|preserve|jsx|jsxImportSource|vite-ignore|vue-ignore|__PURE__)\b/,
  /^\s*#__(?:PURE|NO_SIDE_EFFECTS)__/,
  /^\s*(?:eslint|oxlint|biome)-(?:disable|enable)/,
  /^\s*tslint:/,
  /^\s*biome-ignore/,
  /^\s*(?:prettier|deno-lint|deno-fmt)-ignore/,
  /^\s*(?:istanbul|c8|v8|node|jest|vitest)\s+ignore/,
  /^\s*SPDX-License-Identifier/,
  /^\s*\/\s*<(?:reference|amd-module|amd-dependency)\b/,
  /^\s*webpack[A-Z]/
].map((r) => `(?:${r.source})`).join("|"), "i");
var BLOCK_DIRECTIVE = /^\s*(?:globals?|exported|eslint(?:\s|-env\b|$))/i;
var isDirective = (comment) => DIRECTIVE.test(comment.value) || comment.type === "Block" && BLOCK_DIRECTIVE.test(comment.value);
var isJsdoc = (comment) => comment.type === "Block" && comment.value.startsWith("*");
function getSource(context) {
  const anyContext = context;
  return anyContext.sourceCode ?? anyContext.getSourceCode();
}
var sourceText = (sourceCode) => typeof sourceCode.text === "string" ? sourceCode.text : sourceCode.getText();
function getComments(sourceCode) {
  return sourceCode.getAllComments().filter((comment) => comment.type === "Line" || comment.type === "Block");
}
function lineStart(text, index) {
  const nl = text.lastIndexOf(`
`, index - 1);
  return nl === -1 ? 0 : nl + 1;
}
function isTrailing(text, comment) {
  return text.slice(lineStart(text, comment.range[0]), comment.range[0]).trim() !== "";
}
var VALUE_OFFSET = 2;
function locAt(comment, index) {
  const before = comment.value.slice(0, index);
  const nl = before.lastIndexOf(`
`);
  if (nl === -1) {
    return {
      line: comment.loc.start.line,
      column: comment.loc.start.column + VALUE_OFFSET + index
    };
  }
  let line = comment.loc.start.line;
  for (const ch of before)
    if (ch === `
`)
      line++;
  return { line, column: index - nl - 1 };
}
var spanAt = (comment, index, length) => ({
  start: locAt(comment, index),
  end: locAt(comment, index + length)
});
var rangeAt = (comment, index, length) => [
  comment.range[0] + VALUE_OFFSET + index,
  comment.range[0] + VALUE_OFFSET + index + length
];
function commentBlocks(text, comments) {
  const blocks = [];
  let run = null;
  for (const comment of comments) {
    if (comment.type === "Block" || isTrailing(text, comment)) {
      blocks.push([comment]);
      run = null;
      continue;
    }
    const prev = run && run[run.length - 1];
    if (prev && prev.loc.end.line + 1 === comment.loc.start.line && prev.loc.start.column === comment.loc.start.column) {
      run.push(comment);
    } else {
      run = [comment];
      blocks.push(run);
    }
  }
  return blocks;
}
var blockLoc = (block) => ({
  start: block[0].loc.start,
  end: block[block.length - 1].loc.end
});
function commentLines(comment) {
  return comment.value.split(`
`).map((raw, index) => {
    const text = raw.replace(/^\s*\*+/, "").trim();
    const first = index === 0;
    return {
      text,
      blank: text === "",
      line: comment.loc.start.line + index,
      column: first ? comment.loc.start.column : 0,
      endColumn: first ? comment.loc.start.column + VALUE_OFFSET + raw.length : raw.length
    };
  });
}
function splitSections(lines) {
  const sections = [];
  let current = null;
  for (const line of lines) {
    if (line.blank) {
      current = null;
      continue;
    }
    if (!current || /^@\w/.test(line.text)) {
      current = [];
      sections.push(current);
    }
    current.push(line);
  }
  return sections;
}
function withoutFencedCode(lines) {
  const kept = [];
  let inFence = false;
  for (const line of lines) {
    if (line.text.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (!inFence)
      kept.push(line);
  }
  return kept;
}
var isExampleSection = (section) => /^@example\b/.test(section[0].text);
var sectionLoc = (section) => ({
  start: { line: section[0].line, column: section[0].column },
  end: {
    line: section[section.length - 1].line,
    column: section[section.length - 1].endColumn
  }
});
function isFileHeaderAt(text, start) {
  return /^\s*(?:#![^\n]*\n\s*)?$/.test(text.slice(0, start));
}
function documentsExportAt(text, firstStart, end, exportStart) {
  if (exportStart < end)
    return false;
  const between = text.slice(end, exportStart);
  if (between.trim() !== "")
    return false;
  const newlines = between.split(`
`).length - 1;
  if (newlines <= 1)
    return true;
  return !isFileHeaderAt(text, firstStart);
}
var LICENSE_HEADER = /\b(?:copyright|licen[cs]e|spdx)\b|©|\(c\)/i;
function maskLiterals(value) {
  return value.replace(/`[^`\n]*`|"[^"\n]*"/g, (span) => " ".repeat(span.length));
}
var docsUrl = (name) => `https://github.com/jantimon/eslint-plugin-no-comment-slop/blob/main/docs/rules/${name}.md`;
var maxCommentLines = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Limit how many lines a comment may span",
      recommended: true,
      url: docsUrl("max-comment-lines")
    },
    schema: [
      {
        type: "object",
        properties: {
          max: { type: "integer", minimum: 1 },
          headerMax: { type: "integer", minimum: 1 },
          jsdocSectionMax: { type: "integer", minimum: 1 },
          exportDescriptionMax: { type: "integer", minimum: 1 },
          exportTagMax: { type: "integer", minimum: 1 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      tooLong: "Comment is {{lines}} lines (max {{max}}). If it needs this much explaining, put it in the docs and leave a link",
      sectionTooLong: "This JSDoc section is {{lines}} lines (max {{max}}). Break it up with a blank line or move it to the docs"
    }
  },
  create(context) {
    const options = context.options[0] ?? {};
    const max = options.max ?? 3;
    const headerMax = options.headerMax ?? 5;
    const jsdocSectionMax = options.jsdocSectionMax ?? 5;
    const exportDescriptionMax = options.exportDescriptionMax ?? 10;
    const exportTagMax = options.exportTagMax ?? 7;
    const sourceCode = getSource(context);
    const text = sourceText(sourceCode);
    const exportStarts = [];
    const collect = (node) => {
      if (node.range)
        exportStarts.push(node.range[0]);
    };
    return {
      ExportNamedDeclaration: collect,
      ExportDefaultDeclaration: collect,
      "Program:exit"() {
        for (const block of commentBlocks(text, getComments(sourceCode))) {
          if (block.some(isDirective))
            continue;
          const limit = isFileHeaderAt(text, block[0].range[0]) ? headerMax : max;
          if (isJsdoc(block[0])) {
            const comment = block[0];
            const documentsExport = exportStarts.some((start) => documentsExportAt(text, comment.range[0], comment.range[1], start));
            const lines = withoutFencedCode(commentLines(comment));
            for (const section of splitSections(lines)) {
              if (isExampleSection(section))
                continue;
              const isTag = /^@\w/.test(section[0].text);
              const sectionMax = documentsExport ? isTag ? exportTagMax : exportDescriptionMax : jsdocSectionMax;
              if (section.length > sectionMax) {
                context.report({
                  loc: sectionLoc(section),
                  messageId: "sectionTooLong",
                  data: { lines: String(section.length), max: String(sectionMax) }
                });
              }
            }
            continue;
          }
          const lines = withoutFencedCode(block.flatMap(commentLines)).filter((line) => !line.blank);
          if (lines.length > limit) {
            context.report({
              loc: blockLoc(block),
              messageId: "tooLong",
              data: { lines: String(lines.length), max: String(limit) }
            });
          }
        }
      }
    };
  }
};
var RULER = /^([-=*_~#+/\\.<>|:•])\1{2,}$/;
var TITLED = /^([-=*_~#+/\\|<>])\1{2,}\s*(.*?)\s*\1{3,}$/;
var noBannerComment = {
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description: "Disallow ASCII separator and banner comments",
      recommended: true,
      url: docsUrl("no-banner-comment")
    },
    schema: [
      {
        type: "object",
        properties: {
          flagTitled: { type: "boolean" },
          minLength: { type: "integer", minimum: 2 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      ruler: "No separator comments. Use a blank line, or split the file",
      titled: "No banner comments. Write the heading without the ASCII fencing"
    }
  },
  create(context) {
    const options = context.options[0] ?? {};
    const flagTitled = options.flagTitled ?? true;
    const minLength = options.minLength ?? 3;
    const sourceCode = getSource(context);
    const text = sourceText(sourceCode);
    const ruler = minLength === 3 ? RULER : new RegExp(`^([-=*_~#+/\\\\.<>|•])\\1{${minLength - 1},}$`);
    return {
      Program() {
        for (const comment of getComments(sourceCode)) {
          if (isDirective(comment))
            continue;
          for (const line of commentLines(comment)) {
            if (line.blank)
              continue;
            const isRuler = ruler.test(line.text);
            const titled = !isRuler && flagTitled ? TITLED.exec(line.text) : null;
            if (!isRuler && !titled)
              continue;
            const report = {
              loc: {
                start: { line: line.line, column: line.column },
                end: { line: line.line, column: line.endColumn }
              },
              messageId: isRuler ? "ruler" : "titled"
            };
            const solo = comment.type === "Line" && !isTrailing(text, comment) && /^[ \t]*(\r?\n|$)/.exec(text.slice(comment.range[1]));
            if (solo) {
              const title = titled?.[2];
              if (title) {
                report.fix = (fixer) => fixer.replaceTextRange([comment.range[0], comment.range[1]], `// ${title}`);
              } else {
                const start = lineStart(text, comment.range[0]);
                const end = comment.range[1] + solo[0].length;
                report.fix = (fixer) => fixer.removeRange([start, end]);
              }
            }
            context.report(report);
          }
        }
      }
    };
  }
};
function isBeforeTernaryBranch(text, comment) {
  const before = text.slice(lineStart(text, comment.range[0]), comment.range[0]).trim();
  if (before !== "?" && before !== ":")
    return false;
  return /^[ \t]*(\r?\n|$)/.test(text.slice(comment.range[1]));
}
var noTrailingComment = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow comments on the same line as code",
      recommended: true,
      url: docsUrl("no-trailing-comment")
    },
    schema: [
      {
        type: "object",
        properties: {
          allowShort: { type: "integer", minimum: 0 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      trailing: "Move this comment onto its own line above the code"
    }
  },
  create(context) {
    const options = context.options[0] ?? {};
    const allowShort = options.allowShort ?? 3;
    const sourceCode = getSource(context);
    const text = sourceText(sourceCode);
    return {
      Program() {
        for (const comment of getComments(sourceCode)) {
          if (isDirective(comment))
            continue;
          if (!isTrailing(text, comment))
            continue;
          if (comment.value.trim().length <= allowShort)
            continue;
          if (isBeforeTernaryBranch(text, comment))
            continue;
          context.report({ loc: comment.loc, messageId: "trailing" });
        }
      }
    };
  }
};
var preferJsdocForExports = {
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description: "Require /** */ rather than // for the comment documenting an export",
      recommended: true,
      url: docsUrl("prefer-jsdoc-for-exports")
    },
    schema: [],
    messages: {
      useJsdoc: "Use a /** */ block here: editors only show JSDoc in hover tooltips, not // comments"
    }
  },
  create(context) {
    const sourceCode = getSource(context);
    const text = sourceText(sourceCode);
    const exportStarts = [];
    const collect = (node) => {
      if (node.range)
        exportStarts.push(node.range[0]);
    };
    return {
      ExportNamedDeclaration: collect,
      ExportDefaultDeclaration: collect,
      "Program:exit"() {
        if (exportStarts.length === 0)
          return;
        const lineRuns = commentBlocks(text, getComments(sourceCode)).filter((block) => block[0].type === "Line" && !isTrailing(text, block[0]));
        for (const exportStart of exportStarts) {
          const run = lineRuns.find((block) => documentsExportAt(text, block[0].range[0], block[block.length - 1].range[1], exportStart));
          if (!run || run.some(isDirective))
            continue;
          if (run.some((comment) => LICENSE_HEADER.test(comment.value)))
            continue;
          const first = run[0];
          const indent = text.slice(lineStart(text, first.range[0]), first.range[0]);
          const exportIndent = text.slice(lineStart(text, exportStart), exportStart);
          const body = run.map((comment) => `${indent} * ${comment.value.trim()}`.trimEnd()).join(`
`);
          context.report({
            loc: blockLoc(run),
            messageId: "useJsdoc",
            fix: (fixer) => fixer.replaceTextRange([first.range[0], exportStart], `/**
${body}
${indent} */
${exportIndent}`)
          });
        }
      }
    };
  }
};
var GUTTER = /^[ \t]*\**[ \t]*/;
var multilineJsdocFormat = {
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description: "Require /** and */ on their own lines in a multi-line JSDoc comment",
      recommended: true,
      url: docsUrl("multiline-jsdoc-format")
    },
    schema: [],
    messages: {
      openText: "Break the line after /**: a one-liner stays on one line, anything longer opens with /** alone",
      closeText: "Put */ on its own line: a one-liner stays on one line, anything longer closes with */ alone"
    }
  },
  create(context) {
    const sourceCode = getSource(context);
    const text = sourceText(sourceCode);
    return {
      Program() {
        for (const comment of getComments(sourceCode)) {
          if (!isJsdoc(comment) || isDirective(comment))
            continue;
          const value = comment.value;
          const firstBreak = value.indexOf(`
`);
          if (firstBreak === -1)
            continue;
          const indent = text.slice(lineStart(text, comment.range[0]), comment.range[0]);
          const ownLine = /^[ \t]*$/.test(indent);
          const head = value.slice(1, firstBreak);
          const textStart = 1 + GUTTER.exec(head)[0].length;
          if (value.slice(textStart, firstBreak).trim() !== "") {
            const report = {
              loc: { start: comment.loc.start, end: locAt(comment, textStart) },
              messageId: "openText"
            };
            if (ownLine) {
              report.fix = (fixer) => fixer.replaceTextRange(rangeAt(comment, 1, textStart - 1), `
${indent} * `);
            }
            context.report(report);
          }
          const tail = value.slice(value.lastIndexOf(`
`) + 1);
          if (tail.slice(GUTTER.exec(tail)[0].length).trim() !== "") {
            const textEnd = value.trimEnd().length;
            const report = {
              loc: { start: locAt(comment, value.length), end: comment.loc.end },
              messageId: "closeText"
            };
            if (ownLine) {
              report.fix = (fixer) => fixer.replaceTextRange(rangeAt(comment, textEnd, value.length - textEnd), `
${indent} `);
            }
            context.report(report);
          }
        }
      }
    };
  }
};
var ABBREVIATION = /(?:\be\.g|\bi\.e|\betc|\bvs|\bapprox|\bapp|\bmax|\bmin|\bInc|\bLtd|\bal|\bAve|\bcf|\bfig|\bref)\.$/i;
var noTrailingPeriod = {
  meta: {
    type: "suggestion",
    fixable: "whitespace",
    docs: {
      description: "Disallow a trailing period at the end of a comment",
      recommended: true,
      url: docsUrl("no-trailing-period")
    },
    schema: [
      {
        type: "object",
        properties: {
          includeJsdoc: { type: "boolean" },
          ignoreMultiSentence: { type: "boolean" }
        },
        additionalProperties: false
      }
    ],
    messages: { period: "Drop the trailing period" }
  },
  create(context) {
    const options = context.options[0] ?? {};
    const includeJsdoc = options.includeJsdoc ?? true;
    const ignoreMultiSentence = options.ignoreMultiSentence ?? true;
    const sourceCode = getSource(context);
    return {
      Program() {
        for (const comment of getComments(sourceCode)) {
          if (isDirective(comment))
            continue;
          if (!includeJsdoc && isJsdoc(comment))
            continue;
          const value = comment.value;
          let i = value.length - 1;
          while (i >= 0 && (value[i] === "*" || /\s/.test(value[i])))
            i--;
          if (i < 0 || value[i] !== ".")
            continue;
          const upTo = value.slice(0, i + 1);
          if (upTo.endsWith(".."))
            continue;
          if (ABBREVIATION.test(upTo))
            continue;
          if (ignoreMultiSentence && /[.!?]\s/.test(value.slice(0, i)))
            continue;
          context.report({
            loc: spanAt(comment, i, 1),
            messageId: "period",
            fix: (fixer) => fixer.removeRange(rangeAt(comment, i, 1))
          });
        }
      }
    };
  }
};
var noEmDash = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow em dashes (and optionally en dashes) in comments",
      recommended: true,
      url: docsUrl("no-em-dash")
    },
    schema: [
      {
        type: "object",
        properties: {
          includeEnDash: { type: "boolean" }
        },
        additionalProperties: false
      }
    ],
    messages: {
      dash: "Rewrite this without {{name}}: split the sentence, or use a comma, colon, or parentheses. For the literal character, wrap it in backticks"
    }
  },
  create(context) {
    const options = context.options[0] ?? {};
    const includeEnDash = options.includeEnDash ?? false;
    const sourceCode = getSource(context);
    const chars = includeEnDash ? /[—–]/g : /—/g;
    return {
      Program() {
        for (const comment of getComments(sourceCode)) {
          if (isDirective(comment))
            continue;
          const masked = maskLiterals(comment.value);
          chars.lastIndex = 0;
          let match;
          while ((match = chars.exec(masked)) !== null) {
            const index = match.index;
            context.report({
              loc: spanAt(comment, index, 1),
              messageId: "dash",
              data: { name: match[0] === "—" ? "an em dash" : "an en dash" }
            });
          }
        }
      }
    };
  }
};
var MARKDOWN_TARGET = /!?\[[^\]\n]*\]\([^)\n]*\)|!?\[[^\]\n]*\]\[[^\]\n]*\]|<[^>\s]+>|\b(?:https?:\/\/|www\.)\S+/g;
var maskMarkdown = (value) => value.replace(MARKDOWN_TARGET, (span) => " ".repeat(span.length));
var HTML_ENTITY = /&#?[0-9a-z]+$/i;
var CODE_PUNCTUATION = /[=(){}[\]]/;
var DECLARATION = /^(?:const|let|var|function|class|import|export)\b/;
var CLAUSE_BEFORE = /[\p{L}\p{N}_]\s*$/u;
var CLAUSE_AFTER = /^\s+\p{L}/u;
var noProseSemicolon = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow semicolons that join two clauses in comment prose",
      recommended: true,
      url: docsUrl("no-prose-semicolon")
    },
    schema: [],
    messages: {
      semicolon: "Rewrite this without a semicolon: start a new sentence, or use a comma or parentheses. For code in a comment, wrap it in backticks"
    }
  },
  create(context) {
    const sourceCode = getSource(context);
    return {
      Program() {
        for (const comment of getComments(sourceCode)) {
          if (isDirective(comment))
            continue;
          const raw = comment.value.split(`
`);
          const masked = maskMarkdown(maskLiterals(comment.value)).split(`
`);
          let offset = 0;
          let fenced = false;
          for (const [index, line] of masked.entries()) {
            const start = offset;
            offset += line.length + 1;
            if (raw[index].replace(GUTTER, "").startsWith("```")) {
              fenced = !fenced;
              continue;
            }
            if (fenced)
              continue;
            const gutter = GUTTER.exec(line)[0].length;
            const text = line.slice(gutter);
            if (CODE_PUNCTUATION.test(text) || DECLARATION.test(text))
              continue;
            for (let i = text.indexOf(";");i !== -1; i = text.indexOf(";", i + 1)) {
              const before = text.slice(0, i);
              if (!CLAUSE_BEFORE.test(before))
                continue;
              if (HTML_ENTITY.test(before))
                continue;
              if (!CLAUSE_AFTER.test(text.slice(i + 1)))
                continue;
              context.report({
                loc: spanAt(comment, start + gutter + i, 1),
                messageId: "semicolon"
              });
            }
          }
        }
      }
    };
  }
};
var defaultJargonWords = [
  "utilize",
  "utilise",
  "leverage",
  "delve",
  "facilitate",
  "streamline",
  "seamless",
  "seamlessly",
  "robust",
  "comprehensive",
  "meticulous",
  "meticulously",
  "crucial",
  "pivotal",
  "myriad",
  "plethora"
];
var SUGGESTIONS = {
  utilize: "use",
  utilise: "use",
  leverage: "use",
  facilitate: "help"
};
var escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function wordPattern(word) {
  const escaped = escapeRe(word);
  if (/e$/i.test(word))
    return `${escaped.slice(0, -1)}(?:e|es|ed|ing)`;
  return `${escaped}(?:s|es|ed|ing)?`;
}
function jargonRegex(words) {
  const alternatives = words.slice().sort((a, b) => b.length - a.length).map(wordPattern);
  return new RegExp(`(?<![\\w-])(?:${alternatives.join("|")})(?![\\w-])`, "giu");
}
var noJargon = {
  meta: {
    type: "suggestion",
    hasSuggestions: true,
    docs: {
      description: "Disallow inflated vocabulary in comments",
      recommended: true,
      url: docsUrl("no-jargon")
    },
    schema: [
      {
        type: "object",
        properties: {
          words: { type: "array", items: { type: "string" } },
          extraWords: { type: "array", items: { type: "string" } },
          allow: { type: "array", items: { type: "string" } },
          includeJsdoc: { type: "boolean" }
        },
        additionalProperties: false
      }
    ],
    messages: {
      jargon: "“{{word}}” reads like generated prose. Say it plainly",
      jargonSuggest: "“{{word}}” reads like generated prose. Say “{{with}}”",
      replaceWith: "Replace with “{{with}}”"
    }
  },
  create(context) {
    const options = context.options[0] ?? {};
    const words = options.words ?? defaultJargonWords;
    const extraWords = options.extraWords ?? [];
    const allow = options.allow ?? [];
    const includeJsdoc = options.includeJsdoc ?? true;
    const denied = [...words, ...extraWords].filter((word) => !allow.some((a) => a.toLowerCase() === word.toLowerCase()));
    if (denied.length === 0)
      return {};
    const pattern = jargonRegex(denied);
    const sourceCode = getSource(context);
    return {
      Program() {
        for (const comment of getComments(sourceCode)) {
          if (isDirective(comment))
            continue;
          if (!includeJsdoc && isJsdoc(comment))
            continue;
          const masked = maskLiterals(comment.value);
          pattern.lastIndex = 0;
          let match;
          while ((match = pattern.exec(masked)) !== null) {
            const word = match[0];
            const index = match.index;
            const replacement = SUGGESTIONS[word.toLowerCase()];
            const report = {
              loc: spanAt(comment, index, word.length),
              messageId: replacement === undefined ? "jargon" : "jargonSuggest",
              data: replacement === undefined ? { word } : { word, with: replacement }
            };
            if (replacement !== undefined) {
              const range = rangeAt(comment, index, word.length);
              report.suggest = [
                {
                  messageId: "replaceWith",
                  data: { with: replacement },
                  fix: (fixer) => fixer.replaceTextRange(range, replacement)
                }
              ];
            }
            context.report(report);
          }
        }
      }
    };
  }
};
var asArray = (value) => Array.isArray(value) ? value : [];
var memberInfo = (node) => node.range && node.loc ? { range: node.range, loc: node.loc } : null;
var classMembers = (body) => asArray(body.body).filter((member) => member.kind !== "constructor" && member.type !== "StaticBlock");
var enumMembers = (node) => Array.isArray(node.members) ? node.members : asArray(node.body?.members);
function containerLabel(node) {
  const parent = node.parent;
  const name = node.id?.name ?? parent?.id?.name;
  if (node.type === "TSEnumDeclaration")
    return name ? `enum ${name}` : "this enum";
  if (node.type === "ClassBody")
    return name ? `class ${name}` : "this class";
  if (node.type === "TSInterfaceBody")
    return name ? `interface ${name}` : "this interface";
  return name ? `type ${name}` : "this type";
}
var noJsdocMemberComment = {
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description: "Require /** */ rather than // for the comment documenting a member",
      recommended: true,
      url: docsUrl("prefer-jsdoc-for-members")
    },
    schema: [],
    messages: {
      useJsdoc: "Use a /** */ block here: editors show JSDoc for the member on hover, // comments stay invisible"
    }
  },
  create(context) {
    const sourceCode = getSource(context);
    const text = sourceText(sourceCode);
    const memberStarts = [];
    const add = (nodes) => {
      for (const node of nodes)
        if (node.range)
          memberStarts.push(node.range[0]);
    };
    return {
      TSInterfaceBody: (node) => add(asArray(node.body)),
      TSTypeLiteral: (node) => add(node.members ?? []),
      ClassBody: (node) => add(classMembers(node)),
      TSEnumDeclaration: (node) => add(enumMembers(node)),
      ObjectExpression: (node) => add((node.properties ?? []).filter((p) => p.type !== "SpreadElement")),
      "Program:exit"() {
        if (memberStarts.length === 0)
          return;
        const lineRuns = commentBlocks(text, getComments(sourceCode)).filter((block) => block[0].type === "Line" && !isTrailing(text, block[0]));
        for (const run of lineRuns) {
          if (run.some(isDirective))
            continue;
          const first = run[0];
          const last = run[run.length - 1];
          const memberStart = memberStarts.find((start) => documentsExportAt(text, first.range[0], last.range[1], start));
          if (memberStart === undefined)
            continue;
          const indent = text.slice(lineStart(text, first.range[0]), first.range[0]);
          const memberIndent = text.slice(lineStart(text, memberStart), memberStart);
          const replacement = run.length === 1 ? `/** ${first.value.trim()} */
${memberIndent}` : `/**
${run.map((comment) => `${indent} * ${comment.value.trim()}`.trimEnd()).join(`
`)}
${indent} */
${memberIndent}`;
          context.report({
            loc: blockLoc(run),
            messageId: "useJsdoc",
            fix: (fixer) => fixer.replaceTextRange([first.range[0], memberStart], replacement)
          });
        }
      }
    };
  }
};
var requireMemberDocs = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require docs on every member once most of a type is documented",
      recommended: true,
      url: docsUrl("require-member-docs")
    },
    schema: [
      {
        type: "object",
        properties: {
          minDocumented: { type: "integer", minimum: 1 },
          minRatio: { type: "number", minimum: 0, maximum: 1 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missing: "{{documented}} of {{total}} members of {{container}} are documented. Give this one at least a /** one liner */ too"
    }
  },
  create(context) {
    const options = context.options[0] ?? {};
    const minDocumented = options.minDocumented ?? 3;
    const minRatio = options.minRatio ?? 0.4;
    const sourceCode = getSource(context);
    const text = sourceText(sourceCode);
    const containers = [];
    const add = (label, nodes) => {
      const members = nodes.map(memberInfo).filter((m) => m !== null);
      if (members.length > 0)
        containers.push({ label, members });
    };
    return {
      TSInterfaceBody: (node) => add(containerLabel(node), asArray(node.body)),
      TSTypeLiteral: (node) => add(containerLabel(node), node.members ?? []),
      ClassBody: (node) => add(containerLabel(node), classMembers(node)),
      TSEnumDeclaration: (node) => add(containerLabel(node), enumMembers(node)),
      "Program:exit"() {
        if (containers.length === 0)
          return;
        const blocks = commentBlocks(text, getComments(sourceCode)).filter((block) => !isTrailing(text, block[0]) && !block.some(isDirective));
        for (const { label, members } of containers) {
          const documented = members.map((member) => blocks.some((block) => documentsExportAt(text, block[0].range[0], block[block.length - 1].range[1], member.range[0])));
          const count = documented.filter(Boolean).length;
          if (count === 0)
            continue;
          if (count < minDocumented && count / members.length < minRatio)
            continue;
          members.forEach((member, index) => {
            if (documented[index])
              return;
            context.report({
              loc: member.loc,
              messageId: "missing",
              data: {
                documented: String(count),
                total: String(members.length),
                container: label
              }
            });
          });
        }
      }
    };
  }
};
var XML_DOC_TAG = /<\/?summary>|<\/?remarks>|<param\s+name=|<\/?returns>|<typeparam\b|<inheritdoc\b|<see\s+cref\b/i;
var REGION = /^\s*#\s*(?:end)?region\b/;
var noForeignSyntax = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow comment syntax imported from other languages",
      recommended: true,
      url: docsUrl("no-foreign-syntax")
    },
    schema: [],
    messages: {
      tripleSlash: "Use /** */ for doc comments: /// is Rust and C# syntax and JS tooling ignores it",
      xmlDoc: "Use JSDoc tags instead of C# XML doc tags",
      region: "Drop the {{marker}} marker: split the file instead of folding it"
    }
  },
  create(context) {
    const sourceCode = getSource(context);
    return {
      Program() {
        for (const comment of getComments(sourceCode)) {
          if (isDirective(comment))
            continue;
          if (comment.type === "Line" && comment.value.startsWith("/")) {
            context.report({ loc: comment.loc, messageId: "tripleSlash" });
            continue;
          }
          if (comment.type === "Line") {
            const region = REGION.exec(comment.value);
            if (region) {
              context.report({
                loc: comment.loc,
                messageId: "region",
                data: { marker: region[0].trim() }
              });
              continue;
            }
          }
          const match = XML_DOC_TAG.exec(comment.value);
          if (match) {
            context.report({
              loc: spanAt(comment, match.index, match[0].length),
              messageId: "xmlDoc"
            });
          }
        }
      }
    };
  }
};
var plugin = {
  meta: {
    name: "eslint-plugin-no-comment-slop",
    version: "0.2.0",
    namespace: "no-comment-slop"
  },
  rules: {
    "max-comment-lines": maxCommentLines,
    "no-banner-comment": noBannerComment,
    "no-trailing-comment": noTrailingComment,
    "prefer-jsdoc-for-exports": preferJsdocForExports,
    "prefer-jsdoc-for-members": noJsdocMemberComment,
    "require-member-docs": requireMemberDocs,
    "multiline-jsdoc-format": multilineJsdocFormat,
    "no-trailing-period": noTrailingPeriod,
    "no-em-dash": noEmDash,
    "no-prose-semicolon": noProseSemicolon,
    "no-jargon": noJargon,
    "no-foreign-syntax": noForeignSyntax
  },
  configs: {}
};
Object.assign(plugin.configs, {
  recommended: {
    name: "no-comment-slop/recommended",
    plugins: { "no-comment-slop": plugin },
    rules: {
      "no-comment-slop/max-comment-lines": "error",
      "no-comment-slop/no-banner-comment": "error",
      "no-comment-slop/no-trailing-comment": "error",
      "no-comment-slop/prefer-jsdoc-for-exports": "error",
      "no-comment-slop/prefer-jsdoc-for-members": "error",
      "no-comment-slop/require-member-docs": "error",
      "no-comment-slop/multiline-jsdoc-format": "error",
      "no-comment-slop/no-trailing-period": "error",
      "no-comment-slop/no-em-dash": "error",
      "no-comment-slop/no-prose-semicolon": "error",
      "no-comment-slop/no-jargon": "error",
      "no-comment-slop/no-foreign-syntax": "error"
    }
  }
});
var { meta, rules, configs } = plugin;
var src_default = plugin;
export {
  configs,
  src_default as default,
  defaultJargonWords,
  meta,
  rules
};
