import { defineConfig } from "oxlint";

export const antiSlopConfig = defineConfig({
  overrides: [
    {
      files: ["scripts/**"],
      rules: {
        "anti-slop/no-unknown-parameters": "off",
        "anti-slop/no-unsafe-dictionary-type": "off",
      },
    },
  ],
  rules: {
    /** ── anti-slop ──────────────────────────────────────────────────── */
    "anti-slop/no-chained-type-assertions": "error",
    "anti-slop/no-conditional-empty-object-spread": "error",
    "anti-slop/no-known-value-widening": "error",
    "anti-slop/no-module-mocking": "error",
    "anti-slop/no-object-parameters": "error",
    "anti-slop/no-reflect-apply": "error",
    "anti-slop/no-reflect-get": "error",
    /**
     * allowInTypeGuards exempts `typeof` inside type predicate functions
     * ((x): x is T): predicates are the named-boundary pattern the rule
     * pushes toward, and hand-rolled JSON/boundary validation has no other
     * way to write the check (dmmulroy/anti-slop#10)
     */
    "anti-slop/no-runtime-typeof": ["error", { allowInTypeGuards: true }],
    "anti-slop/no-shape-in-symbol-names": "error",
    "anti-slop/no-unknown-parameters": "error",
    "anti-slop/no-unknown-returns": "error",
    "anti-slop/no-unknown-type-aliases": "error",
    "anti-slop/no-unsafe-dictionary-type": "error",
    "anti-slop/no-widen-then-assert": "error",
    "anti-slop/require-safety-comment-for-type-assertion": "error",
    /**
     * Core rules that pinch against anti-slop when both are enabled:
     * consistent-indexed-object-style's autofix rewrites index-signature
     * interfaces into `Record` aliases, which no-known-value-widening
     * resolves and re-flags (a fix/break loop)
     *
     * no-immediate-mutation bans the empty-accumulator escape from the same
     * rule. Extending this preset after core turns them off by default
     */
    "typescript/consistent-indexed-object-style": "off",
    "unicorn/no-immediate-mutation": "off",
  },
});

export default antiSlopConfig;
