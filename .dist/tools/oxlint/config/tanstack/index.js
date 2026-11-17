// tools/oxlint/config/tanstack/index.ts
import { defineConfig } from "oxlint";
var tanstackConfig = defineConfig({
  overrides: [
    {
      files: ["**/routes/**/*.{tsx,ts}", "**/app/routes/**/*.{tsx,ts}"],
      rules: {
        "sort-keys": "off",
        "unicorn/filename-case": "off"
      }
    },
    {
      files: ["**/routeTree.gen.ts"],
      rules: {
        "unicorn/filename-case": "off",
        "unicorn/no-abusive-eslint-disable": "off"
      }
    }
  ]
});
export {
  tanstackConfig
};
