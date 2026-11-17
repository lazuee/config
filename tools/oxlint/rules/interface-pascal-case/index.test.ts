import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { ensurePluginBundle, oxBinary } from "../test-helpers";
import { toPascalCase } from "./index";

/** The subset of oxlint's `--format=json` report these fixtures assert on */
interface Diagnostic {
  code: string;
  message: string;
}

describe("toPascalCase", () => {
  test("capitalises camelCase names", () => {
    expect(toPascalCase("myThing")).toBe("MyThing");
    expect(toPascalCase("stagingDir")).toBe("StagingDir");
    expect(toPascalCase("value")).toBe("Value");
  });

  test("splits on underscores and hyphens", () => {
    expect(toPascalCase("staging_dir")).toBe("StagingDir");
    expect(toPascalCase("foo-bar")).toBe("FooBar");
    expect(toPascalCase("user_id")).toBe("UserId");
  });

  test("collapses repeated delimiters and trims the edges", () => {
    expect(toPascalCase("a__b")).toBe("AB");
    expect(toPascalCase("_a_")).toBe("A");
  });

  test("keeps trailing acronym runs whole", () => {
    expect(toPascalCase("fOO")).toBe("FOO");
  });

  test("does not invent letters for leading digits", () => {
    expect(toPascalCase("1foo")).toBe("1foo");
  });
});

/**
 * End-to-end coverage through the real `oxlint` CLI: scope analysis and fix
 * application only happen when the rule is dispatched by the plugin host
 */
describe("interface-pascal-case (cli integration)", () => {
  const pluginBundle = ensurePluginBundle();

  function lintFixture(files: Record<string, string>, fix = false) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "interface-pascal-case-cli-"));

    fs.writeFileSync(
      path.join(root, ".oxlintrc.json"),
      JSON.stringify({
        jsPlugins: [pluginBundle],
        rules: { "lazuee/interface-pascal-case": "error" },
      }),
    );

    for (const [relativePath, source] of Object.entries(files)) {
      const target = path.join(root, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, source);
    }

    const args = [oxBinary, "--config", ".oxlintrc.json", "--format=json"];
    if (fix) args.push("--fix");
    args.push(".");

    const result = Bun.spawnSync(args, { cwd: root });
    // SAFETY: `--format=json` makes oxlint emit its own report shape, so the
    // parsed value has exactly the `diagnostics` field read below
    const report = JSON.parse(result.stdout.toString()) as { diagnostics: Diagnostic[] };
    const sources = Object.fromEntries(
      Object.keys(files).map((relativePath) => [
        relativePath,
        fs.readFileSync(path.join(root, relativePath), "utf-8"),
      ]),
    );

    fs.rmSync(root, { force: true, recursive: true });

    return {
      messages: report.diagnostics
        .filter((diagnostic) => diagnostic.code.includes("interface-pascal-case"))
        .map((diagnostic) => diagnostic.message),
      sources,
    };
  }

  test("reports the prefer-alias style message", () => {
    const { messages } = lintFixture({ "src/thing.ts": "interface myThing {}\n" });

    expect(messages).toEqual(["Unexpected interface name myThing. Use MyThing instead"]);
  });

  test("renames a non-exported interface and every in-file reference", () => {
    const { messages, sources } = lintFixture(
      {
        "src/thing.ts": [
          "interface myThing {",
          "  value: number;",
          "}",
          "",
          "function use(t: myThing): myThing {",
          "  return t;",
          "}",
          "",
          "export const a: myThing = { value: 1 };",
          "",
        ].join("\n"),
      },
      true,
    );

    expect(messages).toEqual([]);
    expect(sources["src/thing.ts"]).toBe(
      [
        "interface MyThing {",
        "  value: number;",
        "}",
        "",
        "function use(t: MyThing): MyThing {",
        "  return t;",
        "}",
        "",
        "export const a: MyThing = { value: 1 };",
        "",
      ].join("\n"),
    );
  });

  test("renames snake_case declarations and references", () => {
    const { sources } = lintFixture(
      {
        "src/thing.ts":
          "interface staging_dir {\n  value: number;\n}\n\nexport const a: staging_dir = { value: 1 };\n",
      },
      true,
    );

    expect(sources["src/thing.ts"]).toContain("interface StagingDir {");
    expect(sources["src/thing.ts"]).toContain("export const a: StagingDir");
  });

  test("does not fix an exported interface, only reports it", () => {
    const source =
      "export interface exportedThing {\n  value: number;\n}\n\nconst a: exportedThing = { value: 1 };\n";
    const { messages, sources } = lintFixture({ "src/thing.ts": source }, true);

    expect(messages).toEqual([
      "Unexpected interface name exportedThing. Use ExportedThing instead. It is exported, so rename its usages in every file manually; no autofix is available",
    ]);
    expect(sources["src/thing.ts"]).toBe(source);
  });

  test("reports unrenamable names without a suggestion", () => {
    const { messages } = lintFixture({ "src/thing.ts": "interface café {}\n" });

    expect(messages).toEqual(["Interface name café must use PascalCase"]);
  });
});
