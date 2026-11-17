# config

Shared TypeScript, Oxlint and Oxfmt configs for my projects.

- [Install](#install)
- [Oxlint](#oxlint)
- [Oxfmt](#oxfmt)
- [TypeScript](#typescript)
- [Rules authored here](#rules-authored-here)
- [Development](#development)

## Install

```sh
bun add -d @lazuee/config
```

Every plugin a preset enables is a peer dependency/must be installed too; the
ones a preset needs are declared as optional peers, so install the preset's
dependencies yourself. `./oxlint` (the full preset) needs all of them:

```sh
bun add -d @lazuee/config eslint-plugin-github eslint-plugin-sonarjs oxlint oxlint-plugin-react-doctor oxlint-tailwindcss
```

## Oxlint

Composable presets. Start from `core` and add what the project uses:

```ts
// oxlint.config.ts
import { defineConfig } from "oxlint";

import core from "@lazuee/config/oxlint/core";
import jsPlugins from "@lazuee/config/oxlint/js-plugins";
import react from "@lazuee/config/oxlint/react";

export default defineConfig({
  extends: [core, react, jsPlugins],
  ignorePatterns: core.ignorePatterns,
  jsPlugins: jsPlugins.jsPlugins,
});
```

`@lazuee/config/oxlint` is the same combination of `core`, `react` and six
`js-plugins` entries (`lazuee`, `react-doctor`, `anti-slop`, `no-comment-slop`,
`shadcn`, `sonarjs`), for projects that want most of it in one import.

| Export                       | Contents                                              |
| ---------------------------- | ----------------------------------------------------- |
| `oxlint`                     | `core` + `react` + the six `js-plugins` above         |
| `oxlint/core`                | Base rules, environment, shared `ignorePatterns`      |
| `oxlint/react`               | `react`, `react-perf` and `jsx-a11y` rules            |
| `oxlint/js-plugins`          | Third-party and local js-plugins with their rule sets |
| `oxlint/remix`               | Remix overrides                                       |
| `oxlint/tanstack`            | TanStack Router file-routing overrides                |
| `oxlint/tanstack/js-plugins` | React Doctor's TanStack Query/Router/Start rules      |
| `oxlint/rules`               | The `lazuee/*` rules as a plugin                      |

Two `js-plugins` entries are **not** in `oxlint` and have to be added to
`js-plugins` yourself: `github` and `tailwindcss`, both project-shape dependent.

`sonarjs` needs the TypeScript workaround in [TypeScript](#typescript); the
preset throws a named error rather than letting the plugin fail obscurely.

`oxlint/tanstack/js-plugins` rules fire on generic JSX (they recommend TanStack
replacements), so it is opt-in rather than part of `js-plugins`.

### Local rules

`lazuee/*` rules ship in `@lazuee/config/oxlint/rules` and are enabled by
`js-plugins`:

- `prefer-alias` — reports import/re-export specifiers that a `tsconfig.json`
  `paths` alias (or the rule's `alias` option) spells shorter, and fixes them.
  Siblings, installed packages and query-suffixed virtual modules are handled.
- `interface-pascal-case` — PascalCase interface names; non-exported interfaces
  are renamed together with their in-file references.
- `no-ts-accessibility` — native class fields over `public`/`private` and TS
  parameter properties.
- `canonical-header-names` — canonical casing for `Headers` names
  (`etag` → `ETag`), opt-in because it only applies to header code.

## Oxfmt

```ts
// oxfmt.config.ts
import config from "@lazuee/config/oxfmt";

export default config;
```

`@lazuee/config/shared/ignores` exports the `ignorePatterns` array both configs
use, for sharing with other tools.

## TypeScript

```jsonc
// tsconfig.json
{
  "extends": "@lazuee/config/tsconfig-node", // or "tsconfig-react"
}
```

Both are strict, `noEmit`, bundler-resolution ESM configs. They ship as JSON at
the package root because `extends` resolves files, not exports.

### eslint-plugin-sonarjs

Upstream `eslint-plugin-sonarjs` depends on `ts-api-utils`, which reads
`ts.TypeFlags` that TypeScript 5 had and 7 removed. Every sonarjs rule imports
it at module load, so on TypeScript 7 the plugin throws and takes the whole
config down.

`ts-api-utils` resolves the _nearest_ `typescript`, so a TypeScript 5 has to sit
in front of the hoisted 7. The preset ships a `postinstall` that nests it, but
bun does not run dependency lifecycle scripts unless the package is trusted, so
both lines are needed:

```jsonc
// package.json
{ "trustedDependencies": ["@lazuee/config"] }
```

```sh
bun add -d typescript-5@npm:typescript@5.9.3
```

Without them the preset throws a named error at load rather than letting the
plugin fail obscurely. Drop this again once `ts-api-utils` supports TypeScript 7.

## Rules authored here

The four `lazuee/*` rules live under `tools/oxlint/rules`. They are unit tested
directly, and the CLI integration tests additionally drive the built plugin
through the real `oxlint` binary.

Three upstream plugins are vendored under `tools/oxlint/config/vendors` as
self-contained bundles pinned to a commit (`anti-slop`, `no-comment-slop`,
`shadcn`). They are generated — never edit them; re-run
`bun run scripts/build-vendors.ts [ref] [--check]` after bumping a ref.

## Development

```sh
bun run build        # bundle tools/ into dist/ (also emits declarations)
bun run check        # lint, format check, typecheck, tests
bun run test         # tests
bun run lint:agent   # lint with warnings as errors and agent output
```

The repo dogfoods its own preset through `oxlint.config.ts`, which imports the
built `dist/`, so build before linting.

### Toolchain

Bun and Node are pinned in `mise.toml`; `mise install` provisions both and
`mise exec -- <cmd>` (or `mise activate`) puts them on `PATH`. The lockfile from
`mise lock` is committed so CI and other machines resolve the same builds.

The current version is exactly what mise runs; it fails fast instead of quietly
running a different one.

```sh
mise exec -- bun run check
```
