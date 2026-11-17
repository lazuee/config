import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { loadTsConfig } from "@shared/tsconfig";
import type { RuleSeverity } from "@shared/types";
import { defineConfig } from "oxlint";

// SAFETY: `ALL_REACT_DOCTOR_RULES` is a flat `ruleId -> severity` map in the
// plugin's own type declarations; the assertion only restates that shape
const reactDoctorRules = await import("oxlint-plugin-react-doctor")
  .then(({ ALL_REACT_DOCTOR_RULES }) => ALL_REACT_DOCTOR_RULES as Record<string, RuleSeverity>)
  .catch(() => null);

const NEXT_CONFIG_FILENAMES = [
  "next.config.js",
  "next.config.mjs",
  "next.config.cjs",
  "next.config.ts",
  "next.config.mts",
  "next.config.cts",
  "next.config.jsx",
  "next.config.tsx",
  "next.config.cjsx",
  "next.config.mjsx",
] as const;

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

function findProjectRoot(cwd: string): string {
  let dir = cwd;
  while (true) {
    if (existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return dir;
    }
    dir = parent;
  }
}

function hasNextConfig(root: string): boolean {
  return NEXT_CONFIG_FILENAMES.some((filename) => existsSync(path.join(root, filename)));
}

function readPackageJson(root: string): PackageJson | null {
  const packageJsonPath = path.join(root, "package.json");
  if (!existsSync(packageJsonPath)) return null;

  try {
    // SAFETY: only the optional dependency maps are read from this parsed package.json
    return JSON.parse(readFileSync(packageJsonPath, "utf-8")) as PackageJson;
  } catch (error) {
    console.error(`could not read ${packageJsonPath}: ${String(error)}`);
    return null;
  }
}

function hasNextDependency(root: string): boolean {
  const packageJson = readPackageJson(root);
  if (!packageJson) return false;

  return [
    packageJson.dependencies,
    packageJson.devDependencies,
    packageJson.optionalDependencies,
    packageJson.peerDependencies,
  ].some((dependencies) => Boolean(dependencies?.next));
}

const root = findProjectRoot(process.cwd());

/**
 * Detection walks for `package.json`, parses it and parses `tsconfig.json`,
 * all synchronously. Memoizing keeps that to one pass: `nextjsRules` below,
 * the jsx override and the nextjs gate would otherwise each re-read the same
 * files, and a caller selecting this plugin more than once would repeat it
 */
let projectProfile: { usesAutomaticJsxRuntime: boolean; usesNextjs: boolean } | undefined;

function detectProjectProfile(): { usesAutomaticJsxRuntime: boolean; usesNextjs: boolean } {
  if (projectProfile) return projectProfile;

  const usesNextjs = hasNextConfig(root) || hasNextDependency(root);
  const jsxMode = loadTsConfig(root).compilerOptions?.jsx;

  projectProfile = {
    usesAutomaticJsxRuntime: usesNextjs || jsxMode === "react-jsx" || jsxMode === "react-jsxdev",
    usesNextjs,
  };

  return projectProfile;
}

// SAFETY: `nextjsRules` is a flat `ruleId -> "off"` map derived from the
// plugin's own `ruleId -> severity` declarations
const nextjsRules = Object.fromEntries(
  Object.entries(reactDoctorRules ?? {})
    .filter(([rule]) => rule.includes("nextjs"))
    .map(([rule]) => [rule, "off" as RuleSeverity]),
) as Record<string, RuleSeverity>;

export const reactDoctorConfig = defineConfig({
  overrides: [
    {
      files: ["*.jsx", "*.tsx"],
      rules: detectProjectProfile().usesAutomaticJsxRuntime
        ? {}
        : { "react-doctor/react-in-jsx-scope": "error" },
    },
  ],
  rules: {
    // ── react-doctor ────────────────────────────────────────────────────
    ...reactDoctorRules,
    /**
     * Generic React rules
     */
    "react-doctor/activity-wraps-effect-heavy-subtree": "error",
    "react-doctor/advanced-event-handler-refs": "error",
    "react-doctor/async-await-in-loop": "error",
    "react-doctor/async-defer-await": "error",
    "react-doctor/async-parallel": "error",
    "react-doctor/auth-token-in-web-storage": "error",
    "react-doctor/client-localstorage-no-version": "error",
    "react-doctor/client-passive-event-listeners": "error",
    "react-doctor/dialog-has-accessible-name": "error",
    "react-doctor/effect-needs-cleanup": "error",
    "react-doctor/hooks-no-nan-in-deps": "error",
    "react-doctor/html-no-invalid-paragraph-child": "error",
    "react-doctor/html-no-invalid-table-nesting": "error",
    "react-doctor/html-no-nested-interactive": "error",
    "react-doctor/jotai-derived-atom-returns-fresh-object": "error",
    "react-doctor/jotai-select-atom-in-render-body": "error",
    "react-doctor/jotai-tq-use-raw-query-atom": "error",
    "react-doctor/js-async-reduce-without-awaited-acc": "error",
    "react-doctor/js-batch-dom-css": "error",
    "react-doctor/js-cache-property-access": "error",
    "react-doctor/js-cache-storage": "error",
    "react-doctor/js-combine-iterations": "error",
    "react-doctor/js-early-exit": "error",
    "react-doctor/js-flatmap-filter": "error",
    "react-doctor/js-hoist-intl": "error",
    "react-doctor/js-hoist-regexp": "error",
    "react-doctor/js-index-maps": "error",
    "react-doctor/js-length-check-first": "error",
    "react-doctor/js-min-max-loop": "error",
    "react-doctor/js-set-map-lookups": "error",
    "react-doctor/js-tosorted-immutable": "error",
    "react-doctor/no-adjust-state-on-prop-change": "error",
    "react-doctor/no-array-index-as-key": "error",
    "react-doctor/no-async-effect-callback": "error",
    "react-doctor/no-barrel-import": "error",
    "react-doctor/no-call-component-as-function": "error",
    "react-doctor/no-cascading-set-state": "error",
    "react-doctor/no-chain-state-updates": "error",
    "react-doctor/no-create-context-in-render": "error",
    "react-doctor/no-create-ref-in-function-component": "error",
    "react-doctor/no-create-store-in-render": "error",
    "react-doctor/no-derived-state": "error",
    "react-doctor/no-derived-state-effect": "error",
    "react-doctor/no-derived-useState": "error",
    "react-doctor/no-direct-state-mutation": "error",
    "react-doctor/no-disabled-zoom": "error",
    "react-doctor/no-document-start-view-transition": "error",
    "react-doctor/no-document-write": "error",
    "react-doctor/no-dynamic-import-path": "error",
    "react-doctor/no-effect-chain": "error",
    "react-doctor/no-effect-event-handler": "error",
    "react-doctor/no-effect-event-in-deps": "error",
    "react-doctor/no-effect-with-fresh-deps": "error",
    "react-doctor/no-eval": "error",
    "react-doctor/no-event-handler": "error",
    "react-doctor/no-event-trigger-state": "error",
    "react-doctor/no-fetch-in-effect": "error",
    "react-doctor/no-flush-sync": "error",
    "react-doctor/no-full-lodash-import": "error",
    "react-doctor/no-giant-component": "error",
    "react-doctor/no-global-css-variable-animation": "error",
    "react-doctor/no-gray-on-colored-background": "error",
    "react-doctor/no-img-lazy-with-high-fetchpriority": "error",
    "react-doctor/no-initialize-state": "error",
    "react-doctor/no-inline-bounce-easing": "error",
    "react-doctor/no-inline-exhaustive-style": "error",
    "react-doctor/no-inline-prop-on-memo-component": "error",
    "react-doctor/no-json-parse-stringify-clone": "error",
    "react-doctor/no-jsx-element-type": "error",
    "react-doctor/no-large-animated-blur": "error",
    "react-doctor/no-layout-property-animation": "error",
    "react-doctor/no-layout-transition-inline": "error",
    "react-doctor/no-legacy-class-lifecycles": "error",
    "react-doctor/no-legacy-context-api": "error",
    "react-doctor/no-long-transition-duration": "error",
    "react-doctor/no-many-boolean-props": "error",
    "react-doctor/no-mirror-prop-effect": "error",
    "react-doctor/no-moment": "error",
    "react-doctor/no-mutable-in-deps": "error",
    "react-doctor/no-mutating-reducer-state": "error",
    "react-doctor/no-nested-component-definition": "error",
    "react-doctor/no-outline-none": "error",
    "react-doctor/no-pass-data-to-parent": "error",
    "react-doctor/no-pass-live-state-to-parent": "error",
    "react-doctor/no-permanent-will-change": "error",
    "react-doctor/no-polymorphic-children": "error",
    "react-doctor/no-prevent-default": "error",
    "react-doctor/no-prop-callback-in-effect": "error",
    "react-doctor/no-random-key": "error",
    "react-doctor/no-react-dom-deprecated-apis": "error",
    "react-doctor/no-react19-deprecated-apis": "error",
    "react-doctor/no-render-in-render": "error",
    "react-doctor/no-render-prop-children": "error",
    "react-doctor/no-reset-all-state-on-prop-change": "error",
    "react-doctor/no-scale-from-zero": "error",
    "react-doctor/no-secrets-in-client-code": "error",
    "react-doctor/no-self-updating-effect": "error",
    "react-doctor/no-set-state-in-render": "error",
    "react-doctor/no-string-false-on-boolean-attribute": "error",
    "react-doctor/no-sync-xhr": "error",
    "react-doctor/no-tiny-text": "error",
    "react-doctor/no-transition-all": "error",
    "react-doctor/no-uncontrolled-input": "error",
    "react-doctor/no-undeferred-third-party": "error",
    "react-doctor/no-usememo-simple-expression": "error",
    "react-doctor/only-export-components": "error",
    "react-doctor/prefer-dynamic-import": "error",
    "react-doctor/prefer-explicit-variants": "error",
    "react-doctor/prefer-html-dialog": "error",
    "react-doctor/prefer-module-scope-pure-function": "error",
    "react-doctor/prefer-module-scope-static-value": "error",
    "react-doctor/prefer-stable-empty-fallback": "error",
    "react-doctor/prefer-use-effect-event": "error",
    "react-doctor/prefer-use-sync-external-store": "error",
    "react-doctor/prefer-useReducer": "error",
    "react-doctor/react-compiler-no-manual-memoization": "error",
    "react-doctor/redux-useselector-inline-derivation": "error",
    "react-doctor/redux-useselector-returns-new-collection": "error",
    "react-doctor/rendering-animate-svg-wrapper": "error",
    "react-doctor/rendering-conditional-render": "error",
    "react-doctor/rendering-hoist-jsx": "error",
    "react-doctor/rendering-hydration-mismatch-time": "error",
    "react-doctor/rendering-hydration-no-flicker": "error",
    "react-doctor/rendering-script-defer-async": "error",
    "react-doctor/rendering-svg-precision": "error",
    "react-doctor/rendering-usetransition-loading": "error",
    "react-doctor/rerender-defer-reads-hook": "error",
    "react-doctor/rerender-dependencies": "error",
    "react-doctor/rerender-derived-state-from-hook": "error",
    "react-doctor/rerender-functional-setstate": "error",
    "react-doctor/rerender-lazy-ref-init": "error",
    "react-doctor/rerender-lazy-state-init": "error",
    "react-doctor/rerender-memo-before-early-return": "error",
    "react-doctor/rerender-memo-with-default-value": "error",
    "react-doctor/rerender-state-only-in-handlers": "error",
    "react-doctor/rerender-transitions-scroll": "error",
    "react-doctor/server-after-nonblocking": "error",
    "react-doctor/server-auth-actions": "error",
    "react-doctor/server-cache-with-object-literal": "error",
    "react-doctor/server-dedup-props": "error",
    "react-doctor/server-fetch-without-revalidate": "error",
    "react-doctor/server-hoist-static-io": "error",
    "react-doctor/server-no-mutable-module-state": "error",
    "react-doctor/server-sequential-independent-await": "error",
    "react-doctor/use-lazy-motion": "error",
    "react-doctor/zod-v4-no-deprecated-error-apis": "error",
    "react-doctor/zod-v4-no-deprecated-error-customization": "error",
    "react-doctor/zod-v4-no-deprecated-schema-apis": "error",
    "react-doctor/zod-v4-prefer-top-level-string-formats": "error",

    "react-doctor/react-in-jsx-scope": "off",
    "react-doctor/preact-no-react-hooks-import": "off",
  },
  settings: {
    "react-doctor": {
      portedRuleMode: "curated",
    },
  },
});

/**
 * Next.js projects get the nextjs rules enabled; elsewhere they are turned
 * off. Applied after construction so the gate is a statement rather than a
 * conditional spread, and `nextjsRules` is only touched when it applies
 */
if (!detectProjectProfile().usesNextjs) Object.assign(reactDoctorConfig.rules, nextjsRules);

export default reactDoctorConfig;
