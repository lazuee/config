import { definePlugin } from "@oxlint/plugins";

import { canonicalHeaderNames } from "./canonical-header-names";
import { interfacePascalCase } from "./interface-pascal-case";
import { noTypescriptAccessibility } from "./no-ts-accessibility";
import { preferAlias } from "./prefer-alias/rule";

const plugin = definePlugin({
  meta: { name: "lazuee" },

  rules: {
    "prefer-alias": preferAlias,
    "no-ts-accessibility": noTypescriptAccessibility,
    "interface-pascal-case": interfacePascalCase,
    "canonical-header-names": canonicalHeaderNames,
  },
});

export default plugin;
