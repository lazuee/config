// tools/oxlint/config/react/index.ts
import { defineConfig } from "oxlint";
var reactConfig2 = defineConfig({
  plugins: ["react", "react-perf", "jsx-a11y"],
  overrides: [
    {
      files: ["**/{[sS]erver,[aA]pi,[bB]ackend}/**"],
      rules: {
        "react/rules-of-hooks": "off"
      }
    },
    {
      files: ["**/{src,[aA]pp,[fF]ront[eE]nd}/**/[aA]pp.tsx"],
      rules: {
        "unicorn/filename-case": [
          "error",
          {
            case: "pascalCase"
          }
        ]
      }
    }
  ],
  rules: {
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/anchor-ambiguous-text": "error",
    "jsx-a11y/anchor-has-content": "error",
    "jsx-a11y/anchor-is-valid": "error",
    "jsx-a11y/aria-activedescendant-has-tabindex": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-proptypes": "error",
    "jsx-a11y/aria-role": "error",
    "jsx-a11y/aria-unsupported-elements": "error",
    "jsx-a11y/autocomplete-valid": "error",
    "jsx-a11y/click-events-have-key-events": "error",
    "jsx-a11y/control-has-associated-label": "error",
    "jsx-a11y/heading-has-content": "error",
    "jsx-a11y/html-has-lang": "error",
    "jsx-a11y/iframe-has-title": "error",
    "jsx-a11y/img-redundant-alt": "error",
    "jsx-a11y/interactive-supports-focus": "error",
    "jsx-a11y/label-has-associated-control": "error",
    "jsx-a11y/lang": "error",
    "jsx-a11y/media-has-caption": "error",
    "jsx-a11y/mouse-events-have-key-events": "error",
    "jsx-a11y/no-access-key": "error",
    "jsx-a11y/no-aria-hidden-on-focusable": "error",
    "jsx-a11y/no-autofocus": "off",
    "jsx-a11y/no-distracting-elements": "error",
    "jsx-a11y/no-interactive-element-to-noninteractive-role": "error",
    "jsx-a11y/no-noninteractive-element-interactions": "error",
    "jsx-a11y/no-noninteractive-element-to-interactive-role": "error",
    "jsx-a11y/no-noninteractive-tabindex": "error",
    "jsx-a11y/no-redundant-roles": "error",
    "jsx-a11y/no-static-element-interactions": "error",
    "jsx-a11y/prefer-tag-over-role": "error",
    "jsx-a11y/role-has-required-aria-props": "error",
    "jsx-a11y/role-supports-aria-props": "error",
    "jsx-a11y/scope": "error",
    "jsx-a11y/tabindex-no-positive": "error",
    "react-perf/jsx-no-jsx-as-prop": "off",
    "react-perf/jsx-no-new-array-as-prop": "off",
    "react-perf/jsx-no-new-function-as-prop": "off",
    "react-perf/jsx-no-new-object-as-prop": "off",
    "react/capitalized-calls": "error",
    "react/error-boundaries": "error",
    "react/exhaustive-deps": "error",
    "react/exhaustive-effect-dependencies": "error",
    "react/forward-ref-uses-ref": "off",
    "react/function-component-definition": [
      "error",
      {
        namedComponents: "arrow-function",
        unnamedComponents: "arrow-function"
      }
    ],
    "react/globals": "error",
    "react/hook-use-state": "error",
    "react/hooks": "error",
    "react/iframe-missing-sandbox": "error",
    "react/immutability": "error",
    "react/incompatible-library": "error",
    "react/invariant": "error",
    "react/jsx-curly-brace-presence": "error",
    "react/jsx-fragments": "error",
    "react/jsx-key": "error",
    "react/jsx-no-comment-textnodes": "error",
    "react/jsx-no-constructed-context-values": "error",
    "react/jsx-no-duplicate-props": "error",
    "react/jsx-no-target-blank": "error",
    "react/jsx-no-undef": "error",
    "react/jsx-no-useless-fragment": "error",
    "react/jsx-props-no-spread-multi": "error",
    "react/memo-dependencies": "error",
    "react/no-children-prop": "error",
    "react/no-clone-element": "error",
    "react/no-danger-with-children": "error",
    "react/no-deriving-state-in-effects": "error",
    "react/no-did-update-set-state": "error",
    "react/no-direct-mutation-state": "error",
    "react/no-find-dom-node": "error",
    "react/no-is-mounted": "error",
    "react/no-namespace": "error",
    "react/no-react-children": "error",
    "react/no-render-return-value": "error",
    "react/no-set-state": "error",
    "react/no-string-refs": "error",
    "react/no-this-in-sfc": "error",
    "react/no-unescaped-entities": "error",
    "react/no-unknown-property": "off",
    "react/no-unstable-nested-components": "error",
    "react/no-will-update-set-state": "error",
    "react/prefer-es6-class": "error",
    "react/prefer-function-component": "error",
    "react/preserve-manual-memoization": "error",
    "react/purity": "error",
    "react/react-in-jsx-scope": "off",
    "react/refs": "error",
    "react/rule-suppression": "error",
    "react/rules-of-hooks": "error",
    "react/self-closing-comp": "error",
    "react/set-state-in-effect": "error",
    "react/set-state-in-render": "error",
    "react/state-in-constructor": "error",
    "react/static-components": "error",
    "react/style-prop-object": "error",
    "react/syntax": "error",
    "react/todo": "error",
    "react/unsupported-syntax": "error",
    "react/use-memo": "error",
    "react/void-dom-elements-no-children": "error",
    "react/void-use-memo": "error",
    "react/jsx-handler-names": "off",
    "react/only-export-components": ["warn", { allowConstantExport: true }],
    "react/button-has-type": ["off"],
    "react/checked-requires-onchange-or-readonly": ["off"],
    "react/display-name": ["off"],
    "react/forbid-component-props": ["off"],
    "react/forbid-dom-props": ["off"],
    "react/forbid-elements": ["off"],
    "react/jsx-boolean-value": ["error", "never"],
    "react/jsx-filename-extension": [
      "error",
      {
        extensions: [".jsx", ".tsx"]
      }
    ],
    "react/jsx-max-depth": ["off"],
    "react/jsx-no-literals": ["off"],
    "react/jsx-no-script-url": [
      "error",
      [
        {
          name: "Link",
          props: ["to"]
        }
      ]
    ],
    "react/jsx-pascal-case": [
      "error",
      {
        allowAllCaps: true
      }
    ],
    "react/jsx-props-no-spreading": [
      2,
      {
        explicitSpread: "ignore"
      }
    ],
    "react/no-array-index-key": ["off"],
    "react/no-danger": ["warn"],
    "react/no-did-mount-set-state": ["off"],
    "react/no-multi-comp": ["off"],
    "react/no-object-type-as-default-prop": ["off"],
    "react/no-redundant-should-component-update": ["off"],
    "react/no-unsafe": ["off"]
  }
});

export { reactConfig2 };
