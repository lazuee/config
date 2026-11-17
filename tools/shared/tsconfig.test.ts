import { describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { loadTsConfigAliases, stripJsonComments } from "./tsconfig";

function fixture(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tsconfig-aliases-"));

  for (const [name, source] of Object.entries(files)) {
    const target = path.join(root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, source);
  }

  return root;
}

/** Binary-safe mtime bump: a rewrite in the same millisecond is invisible otherwise */
function touch(filePath: string, source: string, seconds: number): void {
  fs.writeFileSync(filePath, source);
  const time = new Date(Date.now() + seconds * 1000);
  fs.utimesSync(filePath, time, time);
}

describe("stripJsonComments", () => {
  it("keeps a URL inside a value while stripping comments and trailing commas", () => {
    const source = `{
      // leading comment
      "url": "http://localhost:3000", /* inline */
      "list": [1, 2,],
    }`;

    expect(JSON.parse(stripJsonComments(source))).toEqual({
      url: "http://localhost:3000",
      list: [1, 2],
    });
  });
});

describe("loadTsConfigAliases", () => {
  it("merges a relative `extends` parent", () => {
    const root = fixture({
      "tsconfig.base.json": JSON.stringify({
        compilerOptions: { paths: { "@base/*": ["./b/*"] } },
      }),
      "tsconfig.json": JSON.stringify({ extends: "./tsconfig.base.json" }),
    });

    expect(loadTsConfigAliases(root).aliasPatterns).toEqual({ "@base/*": ["./b/*"] });
    fs.rmSync(root, { force: true, recursive: true });
  });

  it("rereads the parent when its `paths` change", () => {
    const root = fixture({
      "tsconfig.base.json": JSON.stringify({ compilerOptions: { paths: { "@old/*": ["./o/*"] } } }),
      "tsconfig.json": JSON.stringify({ extends: "./tsconfig.base.json" }),
    });
    const base = path.join(root, "tsconfig.base.json");

    expect(loadTsConfigAliases(root).aliasPatterns).toEqual({ "@old/*": ["./o/*"] });

    // The root file is untouched here; only the parent changed
    touch(base, JSON.stringify({ compilerOptions: { paths: { "@new/*": ["./n/*"] } } }), 1);

    expect(loadTsConfigAliases(root).aliasPatterns).toEqual({ "@new/*": ["./n/*"] });
    fs.rmSync(root, { force: true, recursive: true });
  });

  it("invalidates when the parent is removed", () => {
    const root = fixture({
      "tsconfig.base.json": JSON.stringify({
        compilerOptions: { paths: { "@gone/*": ["./g/*"] } },
      }),
      "tsconfig.json": JSON.stringify({ extends: "./tsconfig.base.json" }),
    });

    expect(loadTsConfigAliases(root).aliasPatterns).toEqual({ "@gone/*": ["./g/*"] });

    fs.rmSync(path.join(root, "tsconfig.base.json"));

    expect(loadTsConfigAliases(root).aliasPatterns).toEqual({});
    fs.rmSync(root, { force: true, recursive: true });
  });

  it("returns nothing for a missing tsconfig", () => {
    const root = fixture({ "keep.txt": "" });

    expect(loadTsConfigAliases(root)).toEqual({ aliasPatterns: {}, basePath: "" });
    fs.rmSync(root, { force: true, recursive: true });
  });
});
