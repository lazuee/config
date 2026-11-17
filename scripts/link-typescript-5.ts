/**
 * `eslint-plugin-sonarjs` -> `ts-api-utils` reaches for `ts.TypeFlags`, which
 * TypeScript 5 shipped and 7 removed. `ts-api-utils` resolves the *nearest*
 * `typescript`, so the hoisted TypeScript 7 wins and every sonarjs rule throws
 * on load.
 *
 * Nesting the TypeScript 5 (`typescript-5`, an npm alias) inside
 * `ts-api-utils` puts it back in front of the resolvable name. bun's
 * `overrides` cannot do this: the `typescript` edge is a peer, which overrides
 * do not re-resolve.
 *
 * Runs after install, is idempotent, and stays quiet unless something changed.
 * Delete once `ts-api-utils` supports TypeScript 7.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";

const supportedMajor = 6;
const projectRoot = process.cwd();

/**
 * Resolves a package directory the way Node would from `from`, walking up.
 * `ts-api-utils` is hoisted to the consumer's root rather than nested under
 * this package, so the preset's own `node_modules` is the wrong place to look
 */
const resolveFrom = (from: string, specifier: string): string | null => {
  let dir = from;

  while (true) {
    const candidate = path.join(dir, "node_modules", specifier);
    if (existsSync(candidate)) return candidate;

    const parent = path.dirname(dir);
    if (parent === dir) return null;

    dir = parent;
  }
};

const versionOf = (packageDirectory: string): number | null => {
  const manifest = path.join(packageDirectory, "package.json");
  if (!existsSync(manifest)) return null;

  const match = /"version":\s*"(?<major>\d+)/u.exec(readFileSync(manifest, "utf-8"));

  return match?.groups?.major === undefined ? null : Number(match.groups.major);
};

const apiUtils = resolveFrom(projectRoot, "ts-api-utils");

// Nothing vendored it (sonarjs not installed yet), or a first run already
// nested the replacement and hid the hoisted copy behind it
if (!apiUtils) process.exit(0);

const nested = path.join(apiUtils, "node_modules", "typescript");
const current =
  versionOf(nested) ?? versionOf(path.join(projectRoot, "node_modules", "typescript"));

// Already nested, or the project's TypeScript is old enough anyway
if (current !== null && current >= supportedMajor && existsSync(nested)) process.exit(0);

if (current !== null && current < supportedMajor) process.exit(0);

const replacement = resolveFrom(projectRoot, "typescript-5");

if (!replacement) {
  console.warn(
    "link-typescript-5: ts-api-utils is running on a TypeScript it cannot read; add `bun add -d typescript-5@npm:typescript@5.9.3`",
  );
  process.exit(0);
}

rmSync(nested, { recursive: true, force: true });
mkdirSync(path.dirname(nested), { recursive: true });
symlinkSync(
  path.relative(path.dirname(nested), replacement) || ".",
  nested,
  process.platform === "win32" ? "junction" : "dir",
);
console.log("link-typescript-5: nested typescript-5 in front of ts-api-utils");
