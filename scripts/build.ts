import fs from "node:fs";
import { rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { $ } from "bun";

import data from "@/package.json";

const cwd = path.resolve(import.meta.dirname, "..");
const outdir = path.join(cwd, "dist");
const staging = path.join(cwd, ".dist-staging");

await rm(staging, { force: true, recursive: true });

const entrypoints = [
  "tools/oxlint/rules/index.ts",
  "tools/oxlint/config/index.ts",
  "tools/oxlint/config/**/{index,plugin}.ts",
  "tools/oxlint/config/vendors/*.ts",
  "tools/oxfmt/index.ts",
  "tools/shared/ignores.ts",
].flatMap((glob) => [...new Bun.Glob(glob).scanSync()]);

/** The package.json fields that name packages a consumer has to supply */
interface DependencyFields {
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

// SAFETY: only the dependency maps are read below; the JSON import describes
// them exactly, it just does not widen them to an index signature on its own
const dependencyFields = data as DependencyFields;

const external = Object.keys({
  ...dependencyFields.dependencies,
  ...dependencyFields.peerDependencies,
  // Optional peers are still peers: inlining one would freeze the consumer's
  // version into the bundle instead of resolving theirs
  ...dependencyFields.optionalDependencies,
});

// tsc refuses file arguments while a tsconfig.json is present (TS5112), so the
// declaration build runs through a generated project that only lists entrypoints
const declarationProject = path.join(cwd, "tsconfig.declarations.json");
try {
  await writeFile(
    declarationProject,
    `${JSON.stringify(
      {
        extends: "./tsconfig.json",
        include: [],
        files: entrypoints,
        compilerOptions: {
          declaration: true,
          emitDeclarationOnly: true,
          noEmit: false,
          outDir: path.basename(staging),
          rootDir: ".",
        },
      },
      undefined,
      2,
    )}\n`,
  );
  await $`tsc --project ${declarationProject}`;
} finally {
  await rm(declarationProject, { force: true });
}

// `path.dirname` yields `"."` for a top-level entrypoint but `path.relative`
// yields `""` for the staging root, so both sides are keyed the same way
const outputDirKey = (relativeDir: string): string => (relativeDir === "" ? "." : relativeDir);

const entrypointDirs = new Set(
  entrypoints.map((entrypoint) => outputDirKey(path.dirname(entrypoint))),
);

interface StagingDir {
  path: string;
  subdirs: StagingDir[];
  doomed: string[];
  keptCount: number;
}

/**
 * tsc follows transitive imports, so it also emits declarations for files that
 * are already bundled into an entrypoint (`rule.d.ts`, `tsconfig-aliases.d.ts`).
 * Keep only what sits next to an entrypoint, then prune the directories their
 * removals emptied, otherwise `rm` leaves bare folders behind in `dist`.
 */
function planStagingPrune(directory: string): StagingDir {
  const plan: StagingDir = { path: directory, subdirs: [], doomed: [], keptCount: 0 };
  const directoryKey = outputDirKey(path.relative(staging, directory));

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);

    if (entry.isDirectory()) plan.subdirs.push(planStagingPrune(target));
    else if (entrypointDirs.has(directoryKey)) plan.keptCount += 1;
    else plan.doomed.push(target);
  }

  return plan;
}

function isStagingDirEmpty(plan: StagingDir): boolean {
  return plan.keptCount === 0 && plan.subdirs.every(isStagingDirEmpty);
}

function collectStagingRemovals(plan: StagingDir): string[] {
  // Deleting an emptied directory takes its whole subtree with it; otherwise
  // only the non-entrypoint files are removed and the folder stays for its
  // entrypoint declarations
  if (isStagingDirEmpty(plan)) return [plan.path];

  return [...plan.doomed, ...plan.subdirs.flatMap(collectStagingRemovals)];
}

const stagingPlan = planStagingPrune(staging);
const removals = [...stagingPlan.doomed, ...stagingPlan.subdirs.flatMap(collectStagingRemovals)];
await Promise.all(removals.map((target) => rm(target, { recursive: true })));

const result = await Bun.build({
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  entrypoints,
  external,
  target: "node",
  splitting: true,
  outdir: staging,
});

if (!result.success) {
  for (const log of result.logs) console.error(log);

  await rm(staging, { force: true, recursive: true });
  process.exit(1);
}

// Sizes are only readable while the outputs still live in the staging dir
const artifacts = result.outputs.map((output) => ({
  name: path.relative(cwd, output.path).replace(`.dist-staging${path.sep}`, "dist/"),
  size: output.size,
}));

// Only replace a working build once the new one is complete
await rm(outdir, { force: true, recursive: true });
await rename(staging, outdir);

for (const artifact of artifacts)
  console.log(` ${artifact.name}  ${(artifact.size / 1024).toFixed(1)} KB`);
