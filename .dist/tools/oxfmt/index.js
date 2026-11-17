import {
  ignorePatterns2
} from "../../chunk-nrt2k7p2.js";

// tools/oxfmt/index.ts
import { defineConfig } from "oxfmt";
var oxfmt_default = defineConfig({
  arrowParens: "always",
  bracketSameLine: false,
  bracketSpacing: true,
  endOfLine: "lf",
  ignorePatterns: ignorePatterns2,
  jsxSingleQuote: false,
  printWidth: 80,
  proseWrap: "never",
  quoteProps: "as-needed",
  semi: true,
  singleQuote: false,
  sortImports: {
    ignoreCase: true,
    newlinesBetween: true,
    order: "asc"
  },
  sortPackageJson: {
    sortScripts: true
  },
  sortTailwindcss: {
    attributes: [
      "class",
      "className",
      "leave",
      "leaveFrom",
      "leaveTo",
      "enter",
      "enterFrom",
      "enterTo"
    ],
    functions: ["clsx", "cva", "tw", "twMerge", "cn", "twJoin", "tv"]
  },
  tabWidth: 2,
  trailingComma: "es5",
  useTabs: false,
  overrides: [
    {
      files: ["*.json", "*.jsonc"],
      options: {
        tabWidth: 2,
        trailingComma: "all"
      }
    }
  ]
});
export {
  oxfmt_default as default
};
