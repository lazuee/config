import { defineConfig } from "oxlint";

export const noCommentSlopConfig = defineConfig({
  rules: {
    /** ── no-comment-slop ──────────────────────────────────────────────────── */
    "no-comment-slop/max-comment-lines": "error",
    "no-comment-slop/multiline-jsdoc-format": "error",
    "no-comment-slop/no-banner-comment": "error",
    "no-comment-slop/no-em-dash": "error",
    "no-comment-slop/no-foreign-syntax": "error",
    "no-comment-slop/no-jargon": "error",
    "no-comment-slop/no-trailing-comment": "error",
    "no-comment-slop/no-trailing-period": "error",
    "no-comment-slop/prefer-jsdoc-for-exports": "error",
    "no-comment-slop/prefer-jsdoc-for-members": "warn",
    "no-comment-slop/require-member-docs": "error",
  },
});

export default noCommentSlopConfig;
