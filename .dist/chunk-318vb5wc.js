import {
  loadTsConfig
} from "./chunk-qa5a0367.js";

// tools/oxlint/config/js-plugins/index.ts
import { existsSync as existsSync2, readFileSync as readFileSync2 } from "node:fs";
import path2 from "node:path";
import { defineConfig as defineConfig9 } from "oxlint";

// tools/oxlint/config/js-plugins/anti-slop.ts
import { defineConfig } from "oxlint";
var antiSlopConfig = defineConfig({
  overrides: [
    {
      files: ["scripts/**"],
      rules: {
        "anti-slop/no-unknown-parameters": "off",
        "anti-slop/no-unsafe-dictionary-type": "off"
      }
    }
  ],
  rules: {
    "anti-slop/no-chained-type-assertions": "error",
    "anti-slop/no-conditional-empty-object-spread": "error",
    "anti-slop/no-known-value-widening": "error",
    "anti-slop/no-module-mocking": "error",
    "anti-slop/no-object-parameters": "error",
    "anti-slop/no-reflect-apply": "error",
    "anti-slop/no-reflect-get": "error",
    "anti-slop/no-runtime-typeof": ["error", { allowInTypeGuards: true }],
    "anti-slop/no-shape-in-symbol-names": "error",
    "anti-slop/no-unknown-parameters": "error",
    "anti-slop/no-unknown-returns": "error",
    "anti-slop/no-unknown-type-aliases": "error",
    "anti-slop/no-unsafe-dictionary-type": "error",
    "anti-slop/no-widen-then-assert": "error",
    "anti-slop/require-safety-comment-for-type-assertion": "error",
    "typescript/consistent-indexed-object-style": "off",
    "unicorn/no-immediate-mutation": "off"
  }
});

// tools/shared/route-filenames.ts
var ROUTE_FILE_GLOB = "**/routes/**/*.{js,jsx,ts,tsx}";
var KEBAB = "[a-z0-9-]+";
var OPTIONAL_CATCH_ALL = `(?:\\.\\.\\.)?${KEBAB}`;
var ROUTE_PARAM_FORM = `\\[\\[\\.\\.\\.${KEBAB}\\]\\]|\\[${OPTIONAL_CATCH_ALL}\\]`;
var ROUTE_TOKEN = `(?:${ROUTE_PARAM_FORM}|${KEBAB})`;
var PAGE_ROUTE_FILENAME_PATTERN = `^_?${ROUTE_TOKEN}+(?:\\.${KEBAB})?$`;

// tools/oxlint/config/js-plugins/github.ts
import { defineConfig as defineConfig2 } from "oxlint";
var githubConfig = defineConfig2({
  overrides: [
    {
      files: [ROUTE_FILE_GLOB],
      rules: {
        "github/filenames-match-regex": "off"
      }
    },
    {
      files: ["**/pages/**/*.{astro,js,jsx,mjs,mts,ts,tsx}"],
      rules: {
        "github/filenames-match-regex": ["error", PAGE_ROUTE_FILENAME_PATTERN]
      }
    }
  ],
  rules: {
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
    "github/no-dataset": "off",
    "github/no-dynamic-script-tag": "error",
    "github/no-implicit-buggy-globals": "off",
    "github/no-inner-html": "error",
    "github/no-innerText": "error",
    "github/no-then": "error",
    "github/no-useless-passive": "error",
    "github/prefer-observers": "error",
    "github/require-passive-events": "error",
    "github/unescaped-html-literal": "off"
  }
});

// tools/oxlint/config/js-plugins/lazuee.ts
import { defineConfig as defineConfig3 } from "oxlint";
var lazueeConfig = defineConfig3({
  overrides: [
    {
      files: ["**/*.{ts,tsx}"],
      rules: {
        "lazuee/interface-pascal-case": "error",
        "lazuee/no-ts-accessibility": "error"
      }
    },
    {
      files: ["**/*.{ts,tsx,js,jsx}"],
      rules: {
        "lazuee/canonical-header-names": "off"
      }
    }
  ],
  rules: {
    "lazuee/canonical-header-names": "off",
    "lazuee/interface-pascal-case": "off",
    "lazuee/no-ts-accessibility": "off",
    "lazuee/prefer-alias": "error"
  }
});

// tools/oxlint/config/js-plugins/no-comment-slop.ts
import { defineConfig as defineConfig4 } from "oxlint";
var noCommentSlopConfig = defineConfig4({
  rules: {
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
    "no-comment-slop/require-member-docs": "error"
  }
});

// tools/oxlint/config/js-plugins/react-doctor.ts
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig as defineConfig5 } from "oxlint";
var reactDoctorRules = await import("oxlint-plugin-react-doctor").then(({ ALL_REACT_DOCTOR_RULES }) => ALL_REACT_DOCTOR_RULES).catch(() => null);
var NEXT_CONFIG_FILENAMES = [
  "next.config.js",
  "next.config.mjs",
  "next.config.cjs",
  "next.config.ts",
  "next.config.mts",
  "next.config.cts",
  "next.config.jsx",
  "next.config.tsx",
  "next.config.cjsx",
  "next.config.mjsx"
];
function findProjectRoot(cwd) {
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
function hasNextConfig(root) {
  return NEXT_CONFIG_FILENAMES.some((filename) => existsSync(path.join(root, filename)));
}
function readPackageJson(root) {
  const packageJsonPath = path.join(root, "package.json");
  if (!existsSync(packageJsonPath))
    return null;
  try {
    return JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  } catch (error) {
    console.error(`could not read ${packageJsonPath}: ${String(error)}`);
    return null;
  }
}
function hasNextDependency(root) {
  const packageJson = readPackageJson(root);
  if (!packageJson)
    return false;
  return [
    packageJson.dependencies,
    packageJson.devDependencies,
    packageJson.optionalDependencies,
    packageJson.peerDependencies
  ].some((dependencies) => Boolean(dependencies?.next));
}
var root = findProjectRoot(process.cwd());
var projectProfile;
function detectProjectProfile() {
  if (projectProfile)
    return projectProfile;
  const usesNextjs = hasNextConfig(root) || hasNextDependency(root);
  const jsxMode = loadTsConfig(root).compilerOptions?.jsx;
  projectProfile = {
    usesAutomaticJsxRuntime: usesNextjs || jsxMode === "react-jsx" || jsxMode === "react-jsxdev",
    usesNextjs
  };
  return projectProfile;
}
var nextjsRules = Object.fromEntries(Object.entries(reactDoctorRules ?? {}).filter(([rule]) => rule.includes("nextjs")).map(([rule]) => [rule, "off"]));
var reactDoctorConfig = defineConfig5({
  overrides: [
    {
      files: ["*.jsx", "*.tsx"],
      rules: detectProjectProfile().usesAutomaticJsxRuntime ? {} : { "react-doctor/react-in-jsx-scope": "error" }
    }
  ],
  rules: {
    ...reactDoctorRules,
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
    "react-doctor/preact-no-react-hooks-import": "off"
  },
  settings: {
    "react-doctor": {
      portedRuleMode: "curated"
    }
  }
});
if (!detectProjectProfile().usesNextjs)
  Object.assign(reactDoctorConfig.rules, nextjsRules);

// tools/oxlint/config/js-plugins/shadcn.ts
import { defineConfig as defineConfig6 } from "oxlint";
var shadcnConfig = defineConfig6({
  overrides: [
    {
      files: ["**/components/**/*.{tsx,jsx}"],
      rules: {
        "shadcn/no-arbitrary-values": "off",
        "shadcn/no-restyle": "off",
        "shadcn/require-static-classes": "off"
      }
    },
    {
      files: ["**/logo.tsx"],
      rules: { "shadcn/no-raw-colors": "off" }
    }
  ],
  rules: {
    "shadcn/no-arbitrary-values": ["error", { allow: ["layout"] }],
    "shadcn/no-inline-styles": [
      "error",
      {
        allow: [
          "left",
          "top",
          "width",
          "height",
          "background",
          "backgroundColor",
          "borderColor",
          "color",
          "gridTemplateColumns",
          "paddingLeft"
        ]
      }
    ],
    "shadcn/no-raw-colors": "error",
    "shadcn/no-restyle": [
      "error",
      {
        allow: ["layout"],
        contracts: [
          {
            allow: ["layout", "spacing"],
            pattern: "(Content|Header|Footer|Group|Panel)$"
          },
          {
            allow: ["layout", "spacing"],
            pattern: "^Card(Action|Content|Description|Footer|Header|Title)?$"
          },
          { allow: ["layout", "shape"], pattern: "^Skeleton$" },
          {
            allow: ["layout", "bg-background", "shadow-none"],
            pattern: "^InputGroup$"
          },
          { allow: ["layout", "hover:bg-transparent"], pattern: "^TableRow$" },
          { allow: ["layout", "spacing"], pattern: "^Tabs$" },
          { allow: ["layout", "border-*"], pattern: "^Sidebar$" },
          {
            allow: ["layout", "spacing"],
            pattern: "^Sidebar(GroupContent|Header|Menu|MenuItem)$"
          },
          { allow: ["layout", "truncate"], pattern: "^BreadcrumbPage$" }
        ]
      }
    ],
    "shadcn/no-unknown-classes": "error",
    "shadcn/require-static-classes": "error"
  }
});

// tools/oxlint/config/js-plugins/sonarjs.ts
import { defineConfig as defineConfig7 } from "oxlint";
var sonarJSConfig = defineConfig7({
  overrides: [
    {
      files: [
        "**/*.{test,spec,test-d,spec-d}.{ts,tsx,js,jsx,mts,cts,mjs,cjs}",
        "**/__tests__/**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}"
      ],
      rules: {
        "sonarjs/no-duplicate-string": "off"
      }
    },
    {
      files: ["**/*.config.{ts,js,mts,mjs}"],
      rules: { "sonarjs/no-duplicate-string": "off" }
    }
  ],
  rules: {
    "sonarjs/arguments-usage": "error",
    "sonarjs/array-constructor": "error",
    "sonarjs/arrow-function-convention": "off",
    "sonarjs/assertions-in-test-cases": "error",
    "sonarjs/async-test-assertions": "error",
    "sonarjs/avoid-mutating-nested-properties-of-shallow-clones": "error",
    "sonarjs/aws-apigateway-public-api": "error",
    "sonarjs/aws-ec2-rds-dms-public": "error",
    "sonarjs/aws-ec2-unencrypted-ebs-volume": "error",
    "sonarjs/aws-efs-unencrypted": "error",
    "sonarjs/aws-iam-all-privileges": "error",
    "sonarjs/aws-iam-all-resources-accessible": "error",
    "sonarjs/aws-iam-privilege-escalation": "error",
    "sonarjs/aws-iam-public-access": "error",
    "sonarjs/aws-opensearchservice-domain": "error",
    "sonarjs/aws-rds-unencrypted-databases": "error",
    "sonarjs/aws-restricted-ip-admin-access": "error",
    "sonarjs/aws-s3-bucket-granted-access": "error",
    "sonarjs/aws-s3-bucket-insecure-http": "error",
    "sonarjs/aws-s3-bucket-public-access": "error",
    "sonarjs/aws-s3-bucket-versioning": "error",
    "sonarjs/aws-sagemaker-unencrypted-notebook": "error",
    "sonarjs/aws-sns-unencrypted-topics": "error",
    "sonarjs/aws-sqs-unencrypted-queue": "error",
    "sonarjs/block-scoped-var": "error",
    "sonarjs/bool-param-default": "error",
    "sonarjs/call-argument-line": "error",
    "sonarjs/chai-determinate-assertion": "error",
    "sonarjs/class-name": "error",
    "sonarjs/code-eval": "error",
    "sonarjs/cognitive-complexity": ["error", 20],
    "sonarjs/comma-or-logical-or-case": "error",
    "sonarjs/comment-regex": "error",
    "sonarjs/composite-assertions": "error",
    "sonarjs/constructor-for-side-effects": "error",
    "sonarjs/content-length": "error",
    "sonarjs/content-security-policy": "error",
    "sonarjs/cookie-no-httponly": "error",
    "sonarjs/cors": "error",
    "sonarjs/csrf": "error",
    "sonarjs/cyclomatic-complexity": "off",
    "sonarjs/declarations-in-global-scope": "error",
    "sonarjs/destructuring-assignment-syntax": "error",
    "sonarjs/disabled-timeout": "error",
    "sonarjs/dynamically-constructed-templates": "error",
    "sonarjs/elseif-without-else": "off",
    "sonarjs/encryption-secure-mode": "error",
    "sonarjs/explicit-test-skip": "error",
    "sonarjs/expression-complexity": "error",
    "sonarjs/file-header": "off",
    "sonarjs/file-name-differ-from-class": "off",
    "sonarjs/file-permissions": "error",
    "sonarjs/file-uploads": "error",
    "sonarjs/fixme-tag": "error",
    "sonarjs/for-in": "error",
    "sonarjs/for-loop-increment-sign": "error",
    "sonarjs/function-inside-loop": "error",
    "sonarjs/future-reserved-words": "error",
    "sonarjs/function-name": "off",
    "sonarjs/generator-without-yield": "error",
    "sonarjs/hardcoded-secret-signatures": "error",
    "sonarjs/hashing": "error",
    "sonarjs/hooks-before-test-cases": "error",
    "sonarjs/inconsistent-function-call": "error",
    "sonarjs/insecure-cookie": "error",
    "sonarjs/insecure-jwt-token": "error",
    "sonarjs/inverted-assertion-arguments": "error",
    "sonarjs/label-position": "error",
    "sonarjs/link-with-target-blank": "error",
    "sonarjs/max-lines": "off",
    "sonarjs/too-many-break-or-continue-in-loop": "off",
    "sonarjs/max-lines-per-function": "off",
    "sonarjs/max-switch-cases": "error",
    "sonarjs/max-union-size": "error",
    "sonarjs/memoize-cache-key": "error",
    "sonarjs/misplaced-loop-counter": "error",
    "sonarjs/nested-control-flow": "off",
    "sonarjs/no-all-duplicated-branches": "error",
    "sonarjs/no-angular-bypass-sanitization": "error",
    "sonarjs/no-built-in-override": "error",
    "sonarjs/no-case-label-in-switch": "error",
    "sonarjs/no-clear-text-protocols": "error",
    "sonarjs/no-code-after-done": "error",
    "sonarjs/no-collapsible-if": "error",
    "sonarjs/no-commented-code": "error",
    "sonarjs/no-dead-store": "error",
    "sonarjs/no-debounce-throttle-in-render": "error",
    "sonarjs/no-debug-commands-in-ui-tests": "error",
    "sonarjs/no-default-utility-imports": "error",
    "sonarjs/no-delete-var": "error",
    "sonarjs/no-duplicate-in-composite": "error",
    "sonarjs/no-duplicate-parameterized-test-case": "error",
    "sonarjs/no-duplicate-string": "error",
    "sonarjs/no-duplicate-test-title": "error",
    "sonarjs/no-duplicated-branches": "error",
    "sonarjs/no-element-overwrite": "error",
    "sonarjs/no-empty-collection": "error",
    "sonarjs/no-empty-parameterized-test-dataset": "error",
    "sonarjs/no-empty-test-file": "error",
    "sonarjs/no-empty-test-title": "error",
    "sonarjs/no-equals-in-for-termination": "error",
    "sonarjs/no-exclusive-tests": "error",
    "sonarjs/no-extra-arguments": "error",
    "sonarjs/no-fallthrough": "error",
    "sonarjs/no-fixed-wait-in-tests": "error",
    "sonarjs/no-floating-point-equality": "error",
    "sonarjs/no-forced-browser-interaction": "error",
    "sonarjs/no-function-declaration-in-block": "error",
    "sonarjs/no-global-this": "error",
    "sonarjs/no-globals-shadowing": "error",
    "sonarjs/no-gratuitous-expressions": "error",
    "sonarjs/no-hardcoded-ip": "error",
    "sonarjs/no-hardcoded-passwords": "error",
    "sonarjs/no-hardcoded-secrets": "error",
    "sonarjs/no-hook-setter-in-body": "error",
    "sonarjs/no-identical-conditions": "error",
    "sonarjs/no-identical-expressions": "error",
    "sonarjs/no-identical-functions": "error",
    "sonarjs/no-ignored-exceptions": "error",
    "sonarjs/no-implicit-dependencies": "off",
    "sonarjs/no-implicit-global": "error",
    "sonarjs/no-incomplete-assertions": "error",
    "sonarjs/no-internal-api-use": "error",
    "sonarjs/no-interpolation-in-inline-snapshots": "error",
    "sonarjs/no-invariant-returns": "error",
    "sonarjs/no-inverted-boolean-check": "error",
    "sonarjs/no-labels": "error",
    "sonarjs/no-literal-call": "error",
    "sonarjs/no-mime-sniff": "error",
    "sonarjs/no-mixed-completion-style": "error",
    "sonarjs/no-mutate-reactive-state-in-updated-hook": "error",
    "sonarjs/no-nested-assignment": "error",
    "sonarjs/no-nested-conditional": "error",
    "sonarjs/no-nested-functions": ["error", { threshold: 4 }],
    "sonarjs/no-nested-incdec": "error",
    "sonarjs/no-nested-switch": "error",
    "sonarjs/no-nested-template-literals": "error",
    "sonarjs/no-networkidle-wait": "error",
    "sonarjs/no-os-command-from-path": "error",
    "sonarjs/no-parameter-reassignment": "error",
    "sonarjs/no-primitive-wrappers": "error",
    "sonarjs/no-redundant-assignments": "error",
    "sonarjs/no-redundant-boolean": "error",
    "sonarjs/no-redundant-jump": "error",
    "sonarjs/no-reference-error": "off",
    "sonarjs/no-referrer-policy": "error",
    "sonarjs/no-same-argument-assert": "error",
    "sonarjs/no-same-line-conditional": "error",
    "sonarjs/no-session-cookies-on-static-assets": "error",
    "sonarjs/no-skipped-tests": "error",
    "sonarjs/no-sonar-comments": "error",
    "sonarjs/no-table-as-layout": "error",
    "sonarjs/no-trivial-assertions": "error",
    "sonarjs/no-undefined-assignment": "error",
    "sonarjs/no-unenclosed-multiline-block": "error",
    "sonarjs/no-uniq-key": "error",
    "sonarjs/no-unthrown-error": "error",
    "sonarjs/no-unused-collection": "error",
    "sonarjs/no-unused-function-argument": "error",
    "sonarjs/no-unused-vars": "error",
    "sonarjs/no-use-of-empty-return-value": "error",
    "sonarjs/no-useless-catch": "error",
    "sonarjs/no-useless-increment": "error",
    "sonarjs/no-useless-react-setstate": "error",
    "sonarjs/no-variable-usage-before-declaration": "error",
    "sonarjs/no-vue-class-component": "error",
    "sonarjs/no-vue-mixins": "error",
    "sonarjs/no-weak-cipher": "error",
    "sonarjs/no-weak-keys": "error",
    "sonarjs/no-wildcard-import": "error",
    "sonarjs/non-existent-operator": "error",
    "sonarjs/object-alt-content": "error",
    "sonarjs/parameterized-tests": "error",
    "sonarjs/prefer-cypress-should": "error",
    "sonarjs/prefer-default-last": "error",
    "sonarjs/prefer-native-axios-alternative": "error",
    "sonarjs/prefer-native-jquery-alternative": "error",
    "sonarjs/prefer-native-lodash-alternative": "error",
    "sonarjs/prefer-object-literal": "error",
    "sonarjs/prefer-promise-shorthand": "error",
    "sonarjs/prefer-single-boolean-return": "error",
    "sonarjs/prefer-specific-assertions": "error",
    "sonarjs/prefer-type-guard": "error",
    "sonarjs/prefer-while": "error",
    "sonarjs/production-debug": "error",
    "sonarjs/pseudo-random": "error",
    "sonarjs/public-static-readonly": "error",
    "sonarjs/publicly-writable-directories": "error",
    "sonarjs/redundant-type-aliases": "error",
    "sonarjs/review-blockchain-mnemonic": "error",
    "sonarjs/session-regeneration": "error",
    "sonarjs/shorthand-property-grouping": "off",
    "sonarjs/stable-tests": "error",
    "sonarjs/stateful-regex": "error",
    "sonarjs/strict-transport-security": "error",
    "sonarjs/super-linear-regex": "error",
    "sonarjs/synchronous-suite-callback": "error",
    "sonarjs/table-header": "error",
    "sonarjs/table-header-reference": "error",
    "sonarjs/test-check-exception": "error",
    "sonarjs/testing-library-prefer-query-by-disappearance": "error",
    "sonarjs/testing-library-query-assertion": "error",
    "sonarjs/todo-tag": "error",
    "sonarjs/unverified-certificate": "error",
    "sonarjs/unverified-hostname": "error",
    "sonarjs/updated-const-var": "error",
    "sonarjs/updated-loop-counter": "error",
    "sonarjs/use-type-alias": "error",
    "sonarjs/variable-name": "error",
    "sonarjs/vitest-mock-at-module-scope": "error",
    "sonarjs/weak-ssl": "error",
    "sonarjs/x-powered-by": "error",
    "sonarjs/xml-parser-xxe": "error"
  }
});

// tools/oxlint/config/js-plugins/tailwindcss.ts
import { defineConfig as defineConfig8 } from "oxlint";
var tailwindConfig = defineConfig8({
  rules: {
    "tailwindcss/no-conflicting-classes": "error",
    "tailwindcss/no-deprecated-classes": "error",
    "tailwindcss/no-duplicate-classes": "warn",
    "tailwindcss/no-unknown-classes": "error",
    "tailwindcss/enforce-canonical": "warn",
    "tailwindcss/no-unnecessary-arbitrary-value": "warn",
    "tailwindcss/enforce-sort-order": "warn",
    "tailwindcss/consistent-variant-order": "warn",
    "tailwindcss/enforce-consistent-important-position": "warn",
    "tailwindcss/no-unnecessary-whitespace": "warn"
  }
});

// tools/oxlint/config/js-plugins/index.ts
var packageRoot = (() => {
  let dir = import.meta.dirname;
  while (!existsSync2(path2.join(dir, "tools", "oxlint")) && dir !== path2.dirname(dir)) {
    dir = path2.dirname(dir);
  }
  return dir;
})();
var localPlugin = (relative) => path2.join(packageRoot, relative);
var jsPluginEntries = [
  { name: "github", specifier: "eslint-plugin-github", config: githubConfig },
  { name: "sonarjs", specifier: "eslint-plugin-sonarjs", config: sonarJSConfig },
  { name: "react-doctor", specifier: "oxlint-plugin-react-doctor", config: reactDoctorConfig },
  { name: "tailwindcss", specifier: "oxlint-tailwindcss", config: tailwindConfig },
  {
    name: "anti-slop",
    specifier: localPlugin("tools/oxlint/config/vendors/anti-slop.js"),
    config: antiSlopConfig
  },
  {
    name: "no-comment-slop",
    specifier: localPlugin("tools/oxlint/config/vendors/no-comment-slop.js"),
    config: noCommentSlopConfig
  },
  {
    name: "shadcn",
    specifier: localPlugin("tools/oxlint/config/vendors/shadcn.js"),
    config: shadcnConfig
  },
  { name: "lazuee", specifier: localPlugin("tools/oxlint/rules/index.js"), config: lazueeConfig }
];
function isPackageSpecifier(specifier) {
  return !path2.isAbsolute(specifier);
}
function isInstalled(specifier) {
  let dir = process.cwd();
  while (true) {
    if (existsSync2(path2.join(dir, "node_modules", specifier)))
      return true;
    const parent = path2.dirname(dir);
    if (parent === dir)
      return false;
    dir = parent;
  }
}
function assertPeersInstalled(entries) {
  const missing = entries.map(({ specifier }) => specifier).filter((specifier) => isPackageSpecifier(specifier) && !isInstalled(specifier));
  if (missing.length > 0)
    throw new Error(`install the plugins' peers first (missing: ${missing.join(", ")})`);
}
function resolveFrom(from, specifier) {
  let dir = from;
  while (true) {
    const candidate = path2.join(dir, "node_modules", specifier);
    if (existsSync2(candidate))
      return candidate;
    const parent = path2.dirname(dir);
    if (parent === dir)
      throw new Error(`${specifier} is not installed`);
    dir = parent;
  }
}
var SONARJS_MAX_TYPESCRIPT_MAJOR = 6;
function assertSonarjsTypescriptVersion(entries) {
  if (!entries.some(({ name }) => name === "sonarjs") || !isInstalled("eslint-plugin-sonarjs"))
    return;
  let major;
  try {
    const apiUtils = resolveFrom(process.cwd(), "ts-api-utils");
    const packageJsonPath = `${resolveFrom(apiUtils, "typescript")}/package.json`;
    major = Number(/"version":\s*"(?<major>\d+)/u.exec(readFileSync2(packageJsonPath, "utf-8"))?.groups?.major);
  } catch {
    return;
  }
  if (major >= SONARJS_MAX_TYPESCRIPT_MAJOR)
    throw new Error(`eslint-plugin-sonarjs supports typescript <${SONARJS_MAX_TYPESCRIPT_MAJOR} but typescript ${major} is installed; ` + "install typescript 5 to keep it, or drop the sonarjs preset");
}
var jsPlugins = [...jsPluginEntries].map(({ name, specifier }) => ({ name, specifier }));
var config = defineConfig9({
  jsPlugins
});
assertPeersInstalled(jsPluginEntries);
assertSonarjsTypescriptVersion(jsPluginEntries);
var defaultConfig = config;
var js_plugins_default = defaultConfig;
function isMergeableRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function asOxlintConfig(pluginConfig) {
  return pluginConfig;
}
var selectJsPlugins2 = (pluginNames) => {
  const names = new Set(pluginNames);
  const known = new Set(jsPluginEntries.map(({ name }) => name));
  const unknown = pluginNames.filter((name) => !known.has(name));
  if (unknown.length > 0)
    throw new Error(`selectJsPlugins: unknown plugin ${unknown.join(", ")} (known: ${[...known].join(", ")})`);
  const selected = jsPluginEntries.filter(({ name }) => names.has(name));
  assertPeersInstalled(selected);
  assertSonarjsTypescriptVersion(selected);
  const configs = jsPluginEntries.filter(({ name }) => names.has(name)).map((entry) => asOxlintConfig(entry.config));
  const isSelectedRule = ([ruleName]) => {
    const [pluginName = ""] = ruleName.split("/");
    return names.has(pluginName);
  };
  return defineConfig9({
    ...config,
    ...configs.reduce(function merge(acc, curr) {
      for (const [key, val] of Object.entries(curr)) {
        if (Array.isArray(acc[key]) && Array.isArray(val)) {
          acc[key] = [...acc[key], ...val];
        } else if (isMergeableRecord(acc[key]) && isMergeableRecord(val)) {
          acc[key] = merge(acc[key], val);
        } else {
          acc[key] = val;
        }
      }
      return acc;
    }, {}),
    jsPlugins: jsPluginEntries.filter((plugin) => names.has(plugin.name)).map(({ name, specifier }) => ({ name, specifier })),
    overrides: configs.flatMap(({ overrides = [] }) => overrides.map((x) => ({
      ...x,
      rules: Object.fromEntries(Object.entries(x.rules ?? {}).filter(isSelectedRule))
    }))),
    rules: Object.assign({}, ...configs.map(({ rules = {} }) => Object.fromEntries(Object.entries(rules).filter(isSelectedRule))))
  });
};

export { selectJsPlugins2, js_plugins_default };
