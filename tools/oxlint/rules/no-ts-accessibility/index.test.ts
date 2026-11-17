import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { ensurePluginBundle, oxBinary } from "../test-helpers";

/** The subset of oxlint's `--format=json` report these fixtures assert on */
interface Diagnostic {
  code: string;
  message: string;
}

/**
 * End-to-end coverage through the real `oxlint` CLI: the fix is only applied
 * by the plugin host, so `RuleTester` cannot exercise it under Bun
 */
describe("no-ts-accessibility (cli integration)", () => {
  const pluginBundle = ensurePluginBundle();

  function lintFixture(source: string, fix = false) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "no-ts-accessibility-cli-"));

    fs.writeFileSync(
      path.join(root, ".oxlintrc.json"),
      JSON.stringify({
        jsPlugins: [pluginBundle],
        rules: { "lazuee/no-ts-accessibility": "error" },
      }),
    );
    fs.mkdirSync(path.join(root, "src"));
    fs.writeFileSync(path.join(root, "src/thing.ts"), source);

    const args = [oxBinary, "--config", ".oxlintrc.json", "--format=json"];
    if (fix) args.push("--fix");
    args.push(".");

    const result = Bun.spawnSync(args, { cwd: root });
    // SAFETY: `--format=json` makes oxlint emit its own report shape, so the
    // parsed value has exactly the `diagnostics` field read below
    const report = JSON.parse(result.stdout.toString()) as { diagnostics: Diagnostic[] };
    const fixed = fs.readFileSync(path.join(root, "src/thing.ts"), "utf-8");

    fs.rmSync(root, { force: true, recursive: true });

    return {
      messages: report.diagnostics
        .filter((diagnostic) => diagnostic.code.includes("no-ts-accessibility"))
        .map((diagnostic) => diagnostic.message),
      fixed,
    };
  }

  test("reports public fields, methods and constructors", () => {
    const { messages } = lintFixture(
      "class A {\n  public x = 1;\n  public m() {}\n  constructor(public z: number) {}\n}\n",
    );

    expect(messages).toHaveLength(3);
  });

  test("reports private and protected members without fixing them", () => {
    const { fixed } = lintFixture("class A {\n  private y = 2;\n  protected z = 3;\n}\n", true);

    // A `#` rename would also have to touch every in-file reference
    expect(fixed).toBe("class A {\n  private y = 2;\n  protected z = 3;\n}\n");
  });

  test("fixes public members and leaves the rest alone", () => {
    const { fixed } = lintFixture(
      "class A {\n  public x = 1;\n  private y = 2;\n  public m() {}\n  constructor(public z: number) {}\n}\n",
      true,
    );

    expect(fixed).toBe(
      "class A {\n  x = 1;\n  private y = 2;\n  m() {}\n  constructor(public z: number) {}\n}\n",
    );
  });

  test("keeps other modifiers and decorators intact", () => {
    const { fixed } = lintFixture(
      "class A {\n  public static readOnly = 1;\n  @dec public decorated = 2;\n  public async run() {}\n  public get value() {\n    return 1;\n  }\n}\n",
      true,
    );

    expect(fixed).toContain("  static readOnly = 1;");
    expect(fixed).toContain("  @dec decorated = 2;");
    expect(fixed).toContain("  async run() {}");
    expect(fixed).toContain("  get value() {");
    expect(fixed).not.toContain("public");
  });

  test("leaves members without an accessibility keyword alone", () => {
    const { messages } = lintFixture("class A {\n  x = 1;\n  m() {}\n}\n");

    expect(messages).toEqual([]);
  });
});
