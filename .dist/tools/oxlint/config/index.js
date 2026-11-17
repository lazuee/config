import"../../../chunk-nrt2k7p2.js";
import {
  coreConfig2
} from "../../../chunk-kd077mk4.js";
import {
  selectJsPlugins2
} from "../../../chunk-318vb5wc.js";
import"../../../chunk-qa5a0367.js";
import {
  reactConfig2
} from "../../../chunk-ea50ft69.js";

// tools/oxlint/config/index.ts
import { defineConfig } from "oxlint";
var config = defineConfig({
  extends: [
    coreConfig2,
    reactConfig2,
    selectJsPlugins2([
      "lazuee",
      "react-doctor",
      "anti-slop",
      "no-comment-slop",
      "shadcn",
      "sonarjs"
    ])
  ],
  ignorePatterns: [...coreConfig2.ignorePatterns ?? []]
});
var config_default = config;
export {
  config_default as default
};
