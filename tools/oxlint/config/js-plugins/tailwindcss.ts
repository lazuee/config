import { defineConfig } from "oxlint";

export const tailwindConfig = defineConfig({
  rules: {
    // ── tailwindcss ────────────────────────────────────────────────────
    /**
     * Correctness: catch real bugs
     */
    "tailwindcss/no-conflicting-classes": "error",
    "tailwindcss/no-deprecated-classes": "error",
    "tailwindcss/no-duplicate-classes": "warn",
    "tailwindcss/no-unknown-classes": "error",
    /** Modernization: keep classes in current canonical form */
    "tailwindcss/enforce-canonical": "warn",
    "tailwindcss/no-unnecessary-arbitrary-value": "warn",
    /** Style and consistency */
    "tailwindcss/enforce-sort-order": "warn",
    "tailwindcss/consistent-variant-order": "warn",
    "tailwindcss/enforce-consistent-important-position": "warn",
    "tailwindcss/no-unnecessary-whitespace": "warn",
  },
});

export default tailwindConfig;
