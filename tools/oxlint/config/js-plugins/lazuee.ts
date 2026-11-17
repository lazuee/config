import { defineConfig } from "oxlint";

export const lazueeConfig = defineConfig({
  overrides: [
    {
      files: ["**/*.{ts,tsx}"],
      rules: {
        "lazuee/interface-pascal-case": "error",
        "lazuee/no-ts-accessibility": "error",
      },
    },
    {
      files: ["**/*.{ts,tsx,js,jsx}"],
      rules: {
        "lazuee/canonical-header-names": "off",
      },
    },
  ],
  rules: {
    "lazuee/canonical-header-names": "off",
    "lazuee/interface-pascal-case": "off",
    "lazuee/no-ts-accessibility": "off",
    /** ── lazuee ──────────────────────────────────────────────────── */
    "lazuee/prefer-alias": "error",
  },
});

export default lazueeConfig;
