import { defineConfig } from "oxlint";

import { coreConfig } from "./core";
import { selectJsPlugins } from "./js-plugins";
import { reactConfig } from "./react";

const config = defineConfig({
  extends: [
    coreConfig,
    reactConfig,
    selectJsPlugins([
      "lazuee",
      "react-doctor",
      "anti-slop",
      "no-comment-slop",
      "shadcn",
      "sonarjs",
    ]),
  ],
  ignorePatterns: [...(coreConfig.ignorePatterns ?? [])],
});

export default config;
