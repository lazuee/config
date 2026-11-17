import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { ExternalPluginEntry } from "oxlint";

import { selectJsPlugins } from "./index";

/** Plugin names of a selected preset; entries may also be bare specifier strings */
/** Entries may also be bare specifier strings, so narrow before reading a name */
function isNamedPlugin(entry: ExternalPluginEntry): entry is { name: string; specifier: string } {
  return typeof entry !== "string";
}

function pluginNames(config: ReturnType<typeof selectJsPlugins>): string[] {
  return (config.jsPlugins ?? []).map((entry) => (isNamedPlugin(entry) ? entry.name : entry));
}

/** Rule ids of a selected preset, sorted so assertions stay order-independent */
function ruleIds(config: ReturnType<typeof selectJsPlugins>): string[] {
  return Object.keys(config.rules ?? {}).toSorted();
}

describe("selectJsPlugins", () => {
  test("keeps the rules of every selected plugin", () => {
    const config = selectJsPlugins(["lazuee"]);

    expect(ruleIds(config)).toEqual([
      "lazuee/canonical-header-names",
      "lazuee/interface-pascal-case",
      "lazuee/no-ts-accessibility",
      "lazuee/prefer-alias",
    ]);
  });

  test("registers only the selected plugins", () => {
    expect(pluginNames(selectJsPlugins(["lazuee"]))).toEqual(["lazuee"]);
  });

  test("merges several selected plugins instead of overwriting", () => {
    const config = selectJsPlugins(["lazuee", "sonarjs"]);

    expect(ruleIds(config)).toContain("lazuee/prefer-alias");
    expect(ruleIds(config)).toContain("sonarjs/no-duplicate-string");
  });

  test("drops rules of plugins that were not selected", () => {
    const config = selectJsPlugins(["lazuee"]);

    // sonarjs is merged into the same config but must not leak in
    expect(ruleIds(config).some((rule) => rule.startsWith("sonarjs/"))).toBe(false);
  });

  test("keeps each plugin's own overrides", () => {
    const config = selectJsPlugins(["sonarjs"]);

    // The test-file override sonarjs ships still applies, and only for it
    expect(config.overrides?.[0]?.rules).toEqual({ "sonarjs/no-duplicate-string": "off" });
  });

  test("filters override rules too, not just top-level rules", () => {
    const config = selectJsPlugins(["lazuee"]);

    for (const override of config.overrides ?? [])
      for (const rule of Object.keys(override.rules ?? {}))
        expect(rule.startsWith("lazuee/")).toBe(true);
  });

  test("throws on an unknown plugin name", () => {
    // SAFETY: the point is a name outside the union; the cast is what callers
    // without type help (plain JS configs) would otherwise supply
    const unknown = "not-a-plugin" as Parameters<typeof selectJsPlugins>[0][number];

    expect(() => selectJsPlugins([unknown])).toThrow(/unknown plugin not-a-plugin/u);
  });

  test("names a missing peer instead of leaving it to oxlint", () => {
    // `eslint-plugin-github` is deliberately not installed in this repo, so the
    // walk finds nothing and the guard has to fire
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "select-js-plugins-"));
    const cwd = process.cwd();
    process.chdir(root);
    try {
      expect(() => selectJsPlugins(["github"])).toThrow(/missing: eslint-plugin-github/u);
    } finally {
      process.chdir(cwd);
      fs.rmSync(root, { force: true, recursive: true });
    }
  });

  test("returns no plugins and no rules when nothing is selected", () => {
    const config = selectJsPlugins([]);

    expect(config.jsPlugins).toEqual([]);
    expect(ruleIds(config)).toEqual([]);
  });
});
