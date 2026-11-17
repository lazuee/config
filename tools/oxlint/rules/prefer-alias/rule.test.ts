import { describe, expect, it, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { ensurePluginBundle, oxBinary } from "../test-helpers";
import {
  capturePathRemainder,
  findAliasTarget,
  findBestAliasMatch,
  isInstalledPackage,
  matchesAliasPattern,
  preserveExtensionOmission,
  resolveModulePath,
  splitSpecifierSuffix,
} from "./rule";

/** The subset of oxlint's `--format=json` report these fixtures assert on */
interface Diagnostic {
  code: string;
  message: string;
}

const aliasPatterns = {
  "@/assets": ["./src/assets"],
  "@/*": ["./src/*", "./public/*"],
  "~ui/*": ["./src/components/*"],
} satisfies Record<string, string[]>;

function write(filePath: string, contents: string) {
  fs.writeFileSync(filePath, contents);
}

function mkdir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

/** A path stub where only package directories "exist" */
function packageExists(absolutePath: string): boolean {
  return absolutePath.endsWith("@oxlint/plugins");
}

function fixtureRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "prefer-alias-"));
  const files = [
    "public/logo.svg",
    "src/App.tsx",
    "src/assets/logo.svg",
    "src/components/api-tester.tsx",
    "src/pages/home/index.tsx",
  ];

  for (const relativePath of files) {
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, "export const value = 1;\n");
  }

  return root;
}

describe("resolveModulePath", () => {
  it("returns the path unchanged when the file exists", () => {
    const root = fixtureRoot();
    const absolute = path.join(root, "src/App.tsx");

    expect(resolveModulePath(absolute)).toBe(absolute);
  });

  it("adds an omitted extension", () => {
    const root = fixtureRoot();

    expect(resolveModulePath(path.join(root, "src/App"))).toBe(path.join(root, "src/App.tsx"));
  });

  it("falls back to an index file", () => {
    const root = fixtureRoot();

    expect(resolveModulePath(path.join(root, "src/pages/home"))).toBe(
      path.join(root, "src/pages/home/index.tsx"),
    );
  });

  it("returns null for missing modules", () => {
    const root = fixtureRoot();

    expect(resolveModulePath(path.join(root, "src/nope"))).toBeNull();
  });
});

describe("capturePathRemainder", () => {
  it("captures the wildcard remainder", () => {
    const root = fixtureRoot();

    expect(capturePathRemainder(path.join(root, "src/components/x.ts"), root, "./src/*")).toBe(
      "components/x.ts",
    );
  });

  it("does not match a sibling directory sharing the prefix", () => {
    const root = fixtureRoot();

    expect(capturePathRemainder(path.join(root, "src2/x.ts"), root, "./src/*")).toBeNull();
  });

  it("does not leak the normalized segment into a deep remainder", () => {
    const root = fixtureRoot();
    const deep = path.join(root, "src/components/x.ts");

    // Guarded because `path.join` collapses nothing here, but a raw `//` or
    // `/./` reaches this function from `path.resolve` on unnormalized input
    expect(
      capturePathRemainder(`${path.join(root, "src")}//components/x.ts`, root, "./src/*"),
    ).toBe("components/x.ts");
    expect(
      capturePathRemainder(`${path.join(root, "src")}/./components/x.ts`, root, "./src/*"),
    ).toBe("components/x.ts");
    expect(capturePathRemainder(deep, root, "./src/*")).toBe("components/x.ts");
  });

  it("matches wildcard-free patterns exactly", () => {
    const root = fixtureRoot();

    expect(capturePathRemainder(path.join(root, "src/assets"), root, "./src/assets")).toBe("");
    expect(
      capturePathRemainder(path.join(root, "src/assets/logo.svg"), root, "./src/assets"),
    ).toBeNull();
  });

  it("honours a wildcard suffix in the path pattern", () => {
    const root = fixtureRoot();

    expect(capturePathRemainder(path.join(root, "src/App.tsx"), root, "./src/*.tsx")).toBe("App");
    expect(capturePathRemainder(path.join(root, "src/App.css"), root, "./src/*.tsx")).toBeNull();
  });

  it("normalizes separators in the remainder", () => {
    const root = fixtureRoot();

    expect(
      capturePathRemainder(path.join(root, "public/nested/deep.svg"), root, "./public/*"),
    ).toBe("nested/deep.svg");
  });
});

describe("findBestAliasMatch", () => {
  it("matches files under every target of a multi-root alias", () => {
    const root = fixtureRoot();

    expect(findBestAliasMatch(path.join(root, "public/logo.svg"), root, aliasPatterns)).toBe(
      "@/logo.svg",
    );
  });

  it("prefers the shortest alias spelling", () => {
    const root = fixtureRoot();

    expect(
      findBestAliasMatch(path.join(root, "src/components/api-tester.tsx"), root, aliasPatterns),
    ).toBe("~ui/api-tester.tsx");
  });

  it("does not treat a wildcard-free alias as a prefix", () => {
    const root = fixtureRoot();

    expect(findBestAliasMatch(path.join(root, "src/assets/logo.svg"), root, aliasPatterns)).toBe(
      "@/assets/logo.svg",
    );
  });

  it("returns null for paths outside every alias", () => {
    const root = fixtureRoot();
    const outside = path.join(root, "server/app.ts");
    fs.mkdirSync(path.dirname(outside), { recursive: true });
    fs.writeFileSync(outside, "export const app = 1;\n");

    expect(findBestAliasMatch(outside, root, aliasPatterns)).toBeNull();
  });
});

describe("findAliasTarget", () => {
  it("tries every target of a wildcard alias instead of only the first", () => {
    const root = fixtureRoot();

    expect(findAliasTarget("@/logo.svg", root, aliasPatterns)).toBe(
      path.join(root, "public/logo.svg"),
    );
  });

  it("resolves the first target when it exists", () => {
    const root = fixtureRoot();

    expect(findAliasTarget("@/App.tsx", root, aliasPatterns)).toBe(path.join(root, "src/App.tsx"));
  });

  it("falls back to the first target when nothing is on disk", () => {
    const root = fixtureRoot();

    expect(findAliasTarget("@/ghost.tsx", root, aliasPatterns)).toBe(
      path.join(root, "src/ghost.tsx"),
    );
  });

  it("supports wildcard aliases pointing at a subdirectory", () => {
    const root = fixtureRoot();

    expect(findAliasTarget("~ui/x.ts", root, aliasPatterns)).toBe(
      path.join(root, "src/components/x.ts"),
    );
  });

  it("supports wildcard-free aliases", () => {
    const root = fixtureRoot();

    expect(findAliasTarget("@/assets", root, aliasPatterns)).toBe(path.join(root, "src/assets"));
  });

  it("ignores specifiers that are not aliased", () => {
    const root = fixtureRoot();

    expect(findAliasTarget("react", root, aliasPatterns)).toBeNull();
    expect(findAliasTarget("@scope/pkg", root, aliasPatterns)).toBeNull();
  });
});

describe("preserveExtensionOmission", () => {
  it("drops an extension that resolution added", () => {
    expect(
      preserveExtensionOmission("../components/api-tester", "@/components/api-tester.tsx"),
    ).toBe("@/components/api-tester");
  });

  it("keeps extensions the source spelled out", () => {
    expect(preserveExtensionOmission("../assets/logo.svg", "@/assets/logo.svg")).toBe(
      "@/assets/logo.svg",
    );
  });

  it("carries a query or fragment suffix onto the rewrite", () => {
    expect(preserveExtensionOmission("../assets/logo.svg?raw", "@/assets/logo.svg")).toBe(
      "@/assets/logo.svg?raw",
    );
    expect(preserveExtensionOmission("../md/readme.md#intro", "@/content/readme.md")).toBe(
      "@/content/readme.md#intro",
    );
  });

  it("keeps a dotted directory name out of the extension check", () => {
    expect(preserveExtensionOmission("../config/oxfmt.config", "@shared/oxfmt.config")).toBe(
      "@shared/oxfmt.config",
    );
  });
});

describe("splitSpecifierSuffix", () => {
  it("separates the path from `?raw` and `#fragment`", () => {
    expect(splitSpecifierSuffix("../assets/logo.svg?raw")).toEqual({
      path: "../assets/logo.svg",
      suffix: "?raw",
    });
    expect(splitSpecifierSuffix("@/content/post.md#intro")).toEqual({
      path: "@/content/post.md",
      suffix: "#intro",
    });
  });

  it("leaves plain specifiers untouched", () => {
    expect(splitSpecifierSuffix("@/components/button")).toEqual({
      path: "@/components/button",
      suffix: "",
    });
  });
});

describe("matchesAliasPattern", () => {
  const patterns = {
    "@/assets": ["./src/assets"],
    "@/*": ["./src/*"],
  } satisfies Record<string, string[]>;

  it("matches wildcard and wildcard-free aliases", () => {
    expect(matchesAliasPattern("@/App.tsx", patterns)).toBe(true);
    expect(matchesAliasPattern("@/assets", patterns)).toBe(true);
  });

  it("honours a wildcard suffix in the alias pattern", () => {
    const suffixed = { "@/hooks/*.ts": ["./src/hooks/*.ts"] } satisfies Record<string, string[]>;

    expect(matchesAliasPattern("@/hooks/use-thing.ts", suffixed)).toBe(true);
    expect(matchesAliasPattern("@/hooks/use-thing", suffixed)).toBe(false);
  });

  it("does not match the bare wildcard prefix itself", () => {
    expect(matchesAliasPattern("@/", patterns)).toBe(false);
  });

  it("ignores unclaimed specifiers", () => {
    expect(matchesAliasPattern("react", patterns)).toBe(false);
    expect(matchesAliasPattern("./relative/path", patterns)).toBe(false);
  });
});

describe("isInstalledPackage", () => {
  // Each case uses its own cwd: verdicts are cached per cwd, and sharing one
  // would let an earlier assertion decide a later one
  it("resolves scoped package directories from the first two segments", () => {
    expect(isInstalledPackage("@oxlint/plugins", "/repo-a", packageExists)).toBe(true);
    expect(isInstalledPackage("@oxlint/plugins/deep/nested", "/repo-b", packageExists)).toBe(true);
  });

  it("requires the full package name for scoped specifiers", () => {
    expect(isInstalledPackage("@oxlint", "/repo-c", packageExists)).toBe(false);
    expect(isInstalledPackage("@other/plugins", "/repo-d", packageExists)).toBe(false);
  });

  it("caches per cwd so workspaces do not share verdicts", () => {
    expect(isInstalledPackage("@oxlint/plugins", "/repo-e", () => false)).toBe(false);
    expect(isInstalledPackage("@oxlint/plugins", "/repo-f", packageExists)).toBe(true);
  });

  it("never treats relative or builtin specifiers as packages", () => {
    expect(isInstalledPackage("./local", "/repo-g", () => true)).toBe(false);
    expect(isInstalledPackage("node:fs", "/repo-g", () => true)).toBe(false);
  });
});

describe("resolveModulePath", () => {
  it("retries a miss once a probe directory gained an entry", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "resolve-retry-"));
    const target = path.join(root, "created-later");
    expect(resolveModulePath(target)).toBeNull();

    write(`${target}.ts`, "export const value = 1;\n");
    expect(resolveModulePath(target)).toBe(`${target}.ts`);

    fs.rmSync(root, { force: true, recursive: true });
  });
});

/**
 * End-to-end coverage through the real `oxlint` CLI: the export-visitor and
 * root-directory regressions only reproduce when a rule is dispatched by the
 * plugin host, which `RuleTester` cannot do under Bun
 */
describe("prefer-alias (cli integration)", () => {
  const pluginBundle = ensurePluginBundle();

  function lintFixture(files: Record<string, string>): string[] {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "prefer-alias-cli-"));

    const alias = {
      "@oxlint/*": ["./tools/oxlint/*"],
      "@/*": ["./src/*"],
      "@utils/*": ["./utils/*"],
    };
    write(path.join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: { paths: alias } }));
    write(
      path.join(root, ".oxlintrc.json"),
      JSON.stringify({
        jsPlugins: [pluginBundle],
        rules: { "lazuee/prefer-alias": "error" },
      }),
    );
    // An npm package that shares the `@oxlint/` alias prefix must never be rewritten
    const packageDir = path.join(root, "node_modules", "@oxlint", "plugins");
    mkdir(packageDir);
    write(path.join(packageDir, "package.json"), '{"name":"@oxlint/plugins","main":"i.js"}');
    write(path.join(packageDir, "index.js"), "export const definePlugin = 1;");

    for (const [relativePath, source] of Object.entries(files)) {
      const target = path.join(root, relativePath);
      mkdir(path.dirname(target));
      write(target, source);
    }

    const result = Bun.spawnSync([oxBinary, "--config", ".oxlintrc.json", "--format=json", "."], {
      cwd: root,
    });
    // SAFETY: `--format=json` makes oxlint emit its own report shape, so the
    // parsed value has exactly the `diagnostics` field read below
    const report = JSON.parse(result.stdout.toString()) as { diagnostics: Diagnostic[] };

    fs.rmSync(root, { force: true, recursive: true });
    // Diagnostics arrive per thread, so file order is not stable across runs
    return report.diagnostics
      .filter((diagnostic) => diagnostic.code.includes("prefer-alias"))
      .map((diagnostic) => diagnostic.message)
      .toSorted();
  }

  const moduleTree = {
    "src/components/api-tester.ts": "export const value = 1;\n",
    "tools/oxlint/index.ts": "export const plugin = 1;\n",
    "tools/oxlint/rules/prefer-alias/rule.ts": "export const preferAlias = 1;\n",
    "utils/format.ts": "export const format = 1;\n",
    "src/assets/logo.svg": "<svg />\n",
  };

  test("rewrites a root-level re-export to the shortest alias", () => {
    const messages = lintFixture({
      ...moduleTree,
      "index.ts": 'export { preferAlias } from "./tools/oxlint/rules/prefer-alias/rule";\n',
    });

    expect(messages).toContain(
      "Unexpected import ./tools/oxlint/rules/prefer-alias/rule. Use @oxlint/rules/prefer-alias/rule instead",
    );
  });

  test("rewrites `export * from` re-exports", () => {
    const messages = lintFixture({
      ...moduleTree,
      "src/barrel.ts": 'export * from "../utils/format";\n',
    });

    expect(messages).toContain("Unexpected import ../utils/format. Use @utils/format instead");
  });

  test("keeps a `?raw` suffix on the rewritten specifier", () => {
    const messages = lintFixture({
      ...moduleTree,
      "src/pages/deep/logo.ts": 'export { default } from "../../assets/logo.svg?raw";\n',
    });

    expect(messages).toEqual([
      "Unexpected import ../../assets/logo.svg?raw. Use @/assets/logo.svg?raw instead",
    ]);
  });

  test("rewrites a one-character remainder through both segment forms", () => {
    const messages = lintFixture({
      ...moduleTree,
      "src/a.ts": "export const value = 1;\n",
      "dup.ts": 'export * from "./src//a";\n',
      "dot.ts": 'export * from "./src/./a";\n',
    });

    expect(messages).toEqual([
      "Unexpected import ./src/./a. Use @/a instead",
      "Unexpected import ./src//a. Use @/a instead",
    ]);
  });

  test("does not re-report a same-directory import already spelled right", () => {
    const messages = lintFixture({
      ...moduleTree,
      "src/nearby.ts": 'import { value } from "./components/api-tester";\nexport { value };\n',
    });

    expect(messages).toEqual([]);
  });

  test("leaves siblings and installed packages alone", () => {
    const messages = lintFixture({
      ...moduleTree,
      "src/nearby.ts": 'import { value } from "./components/api-tester";\nexport { value };\n',
      /**
       * `@oxlint/plugins` resolves onto a sibling of this file (`tools/oxlint/plugins`),
       * which the sibling rule would rewrite to `./plugins` unless the
       * installed-package guard fires first
       */
      "tools/oxlint/consumer.ts":
        'import { definePlugin } from "@oxlint/plugins";\nexport { definePlugin };\n',
    });

    expect(messages).toEqual([]);
  });
});
