import { PAGE_ROUTE_FILENAME_PATTERN, ROUTE_FILE_GLOB } from "@shared/route-filenames";
import { defineConfig } from "oxlint";

export const githubConfig = defineConfig({
  overrides: [
    {
      files: [ROUTE_FILE_GLOB],
      rules: {
        /**
         * File-based router names
         * (e.g. `__root.tsx`, `$.tsx`, `posts.$postId.tsx`, `_layout.tsx`, `{-$slug}.tsx`, `+page.ts`)
         * do not match the GitHub kebab-case regex
         */
        "github/filenames-match-regex": "off",
      },
    },
    {
      files: ["**/pages/**/*.{astro,js,jsx,mjs,mts,ts,tsx}"],
      rules: {
        /**
         * Allow pages-router bracketed route filenames while still rejecting non-route names in `pages/`
         * (e.g. `[slug].astro`, `[...slug].astro`, `[[...slug]].tsx`, `[lang]-[version].astro`
         * and Next.js requires `_app`, `_document` and `_error`)
         */
        "github/filenames-match-regex": ["error", PAGE_ROUTE_FILENAME_PATTERN],
      },
    },
  ],
  rules: {
    /** ── github ───────────────────────────────────────────────────────── */

    "github/a11y-aria-label-is-well-formatted": "error",
    "github/a11y-no-title-attribute": "error",
    "github/a11y-no-visually-hidden-interactive-element": "error",
    "github/a11y-role-supports-aria-props": "error",
    "github/a11y-svg-has-accessible-name": "error",
    "github/array-foreach": "error",
    "github/async-currenttarget": "error",
    "github/async-preventdefault": "error",
    "github/authenticity-token": "error",
    "github/filenames-match-regex": "error",
    "github/get-attribute": "error",
    "github/js-class-name": "error",
    "github/no-blur": "error",
    "github/no-d-none": "error",
    /** Conflicts with unicorn/prefer-dom-node-dataset, which is the benchmark */
    "github/no-dataset": "off",
    "github/no-dynamic-script-tag": "error",
    /**
     * The JS plugin bridge misreads module-scoped declarations (e.g. Astro
     * frontmatter) as implicit globals, producing false positives.
     */
    "github/no-implicit-buggy-globals": "off",
    "github/no-inner-html": "error",
    "github/no-innerText": "error",
    "github/no-then": "error",
    "github/no-useless-passive": "error",
    "github/prefer-observers": "error",
    "github/require-passive-events": "error",
    /** Mirrors the ESLint preset */
    "github/unescaped-html-literal": "off",
  },
});

export default githubConfig;
