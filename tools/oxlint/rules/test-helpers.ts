import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "../../..");

/** Built plugin bundle, and the oxlint binary the integration fixtures drive */
export const pluginBundle = path.join(repoRoot, ".dist", "tools", "oxlint", "rules", "index.js");
export const oxBinary = path.join(repoRoot, "node_modules", ".bin", "oxlint");

function buildPlugin(): void {
  const result = Bun.spawnSync(["bun", "run", "build"], {
    cwd: repoRoot,
    stderr: "inherit",
  });

  if (result.exitCode !== 0) throw new Error("building the plugin bundle failed");

  // The build is best-effort here; a missing artifact would surface as a
  // confusing "plugin not found" from oxlint instead of a clear failure
  if (!fs.existsSync(pluginBundle)) throw new Error(`build did not emit ${pluginBundle}`);
}

/**
 * The built plugin bundle, building it once per test process when `/.dist` is
 * absent. Integration tests drive the real `oxlint` binary, which needs the
 * bundle; making that implicit keeps a fresh clone from silently skipping them
 */
export function ensurePluginBundle(): string {
  if (!fs.existsSync(pluginBundle)) buildPlugin();

  return pluginBundle;
}
