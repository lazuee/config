import { ignorePatterns } from "@shared/ignores";
import { defineConfig } from "oxfmt";

export default defineConfig({
  arrowParens: "always",
  bracketSameLine: false,
  bracketSpacing: true,
  endOfLine: "lf",
  ignorePatterns,
  jsxSingleQuote: false,
  printWidth: 80,
  proseWrap: "never",
  quoteProps: "as-needed",
  semi: true,
  singleQuote: false,
  sortImports: {
    ignoreCase: true,
    newlinesBetween: true,
    order: "asc",
  },
  sortPackageJson: {
    sortScripts: true,
  },
  sortTailwindcss: {
    attributes: [
      "class",
      "className",
      // headless ui
      "leave",
      "leaveFrom",
      "leaveTo",
      "enter",
      "enterFrom",
      "enterTo",
    ],
    functions: ["clsx", "cva", "tw", "twMerge", "cn", "twJoin", "tv"],
  },
  tabWidth: 2,
  trailingComma: "es5",
  useTabs: false,
  overrides: [
    {
      files: ["*.json", "*.jsonc"],
      options: {
        tabWidth: 2,
        trailingComma: "all",
      },
    },
  ],
});
