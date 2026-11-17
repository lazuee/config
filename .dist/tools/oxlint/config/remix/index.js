// tools/oxlint/config/remix/index.ts
import { defineConfig } from "oxlint";
var remix_default = defineConfig({
  overrides: [
    {
      files: ["**/routeTree.gen.ts"],
      rules: {
        "unicorn/filename-case": "off",
        "unicorn/no-abusive-eslint-disable": "off"
      }
    }
  ],
  rules: {}
});
export {
  remix_default as default
};
