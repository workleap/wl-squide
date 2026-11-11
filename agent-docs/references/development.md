# Development Guide

## pnpm Workspace

**pnpm does NOT hoist dependencies.** Never add a package-level devDependency to the workspace root — it will not be available in the package. Each package must declare its own devDependencies in its own `package.json`. The workspace root only lists tooling used by root-level scripts.

## JIT Packages

When possible, packages and sample applications are configured for
[JIT packages](https://www.shew.dev/monorepos/packaging/jit) — they compile on demand rather
than requiring a separate build step during development.

## Environment Variables (`.env.local`)

Create a `.env.local` file at the workspace root (git-ignored) with:

- `LOGROCKET_APP_ID` — `frontend-platform-team-dev` LogRocket project
- `HONEYCOMB_API_KEY` — `frontend-platform-team-dev` Honeycomb environment
- `LAUNCH_DARKLY_CLIENT_ID` — `Frontend-platform-team` LaunchDarkly environment

These are used by `turbo.json` build inputs and sample applications.

## Telemetry (Development)

- **LogRocket** — sample app data goes to `frontend-platform-team-dev` project
- **Honeycomb** — traces go to projects within `frontend-platform-team-dev` environment.
  Query with `root.name = squide-bootstrapping` in the `WHERE` condition.

## Retype (Documentation)

User-facing docs use [Retype](https://retype.com/) with Pro features. Run `pnpm dev-docs` to
start the dev server. If licensing issues occur, set up a Retype wallet:

```bash
npx retype wallet --add <license-key>
```

The `RETYPE_API_KEY` GitHub secret must contain a valid license for CI.

## Sample Deployment

Samples are deployed to Netlify:

| Sample | Deploy Command | Host URL |
|--------|---------------|----------|
| basic | `pnpm deploy-basic` | [squide-basic-host.netlify.app](https://squide-basic-host.netlify.app/) |
| endpoints | `pnpm deploy-endpoints` | [squide-endpoints-host.netlify.app](https://squide-endpoints-host.netlify.app/) |

## Dependency Versioning

**All `devDependencies` must use exact (fixed) versions.** Do not use `^`, `~`, or any other range specifier. When adding or updating a devDependency, pin it to the exact version (e.g., `"vitest": "3.1.1"`, not `"vitest": "^3.1.1"`).

Use `pnpm add -D --save-exact <package>` (or `pnpm add -DE <package>`) to ensure exact versions.

### GitHub package firewall

The repository `.npmrc` routes every install through the `gsoft` GitHub package firewall (`https://package-firewall.githubapp.com/npm/enterprises/gsoft`). The firewall decides which versions are installable: it blocks versions that violate its policies (e.g. `AttestationDowngradePolicy`, a release without the provenance an earlier version had) and doesn't serve releases younger than roughly 42 to 48 hours.

- **Auth token**: lives in the user-level `~/.npmrc` (see CONTRIBUTING.md). pnpm ignores auth tokens in a repository `.npmrc`. CI writes `github.token` to `~/.npmrc` before installing, in every workflow that runs pnpm.
- **`minimumReleaseAge: 1440`**: pnpm's own release-age gate (24 hours, in minutes), on top of the firewall's. It matches pnpm 12's default but is set explicitly so the policy is visible. Do NOT remove or lower it. Since the firewall only serves older releases, every installable version already clears it. `minimumReleaseAgeExclude` lets `@workleap/*` and `@workleap-telemetry/*` skip pnpm's gate.
- **`.pnpmfile.cjs`**: the firewall's metadata still points every tarball at `registry.npmjs.org`. The pnpmfile downloads those tarballs from the firewall instead and removes the npmjs URLs from `pnpm-lock.yaml`; `globalPnpmfile` in `pnpm-workspace.yaml` covers `pnpm dlx` / `pnpx`, which ignore the project pnpmfile. Never remove either, and never use `--ignore-pnpmfile`. Requires pnpm 12.18+ (custom fetchers).
- **Lockfile tarball URLs**: CI fails on any `tarball:` line in `pnpm-lock.yaml`. After editing the pnpmfile, or when CI reports one, run `pnpm install --fix-lockfile` and commit the lockfile. A plain `pnpm install` skips the pnpmfile hooks when the lockfile is up to date, and the lockfile checksum doesn't track the pnpmfile (pnpm excludes a global pnpmfile from it).
- **Blocked versions**: when a version exists on npmjs but the install can't resolve or download it, the firewall blocks it. Pin a version the firewall serves with a scoped override (see below).
- **Publishing**: published packages set `publishConfig.registry` to `https://registry.npmjs.org/`, and `changeset.yml` sets `pnpm_config_registry` on the publish step. See [release-process.md](./release-process.md).

### Pinned transitive dependencies (pnpm overrides)

`pnpm-workspace.yaml` has an `overrides:` block that pins transitive deps to specific versions. Each entry exists for a concrete reason — do NOT remove or relax them without verifying the underlying issue is gone (test builds AND tests, not just `pnpm install`):

- **`ts-checker-rspack-plugin>chokidar: 4.0.1`** — the package firewall blocks `chokidar@4.0.3` (`AttestationDowngradePolicy`) and serves nothing newer in 4.x.

**Important pnpm quirk:** changing an `overrides` entry does NOT trigger re-resolution on `pnpm install` (even with `--force` or `--no-frozen-lockfile`) — pnpm reports "Already up to date" and leaves the old versions in the lockfile. To apply override changes, delete `pnpm-lock.yaml` and run `pnpm install --lockfile-only`.

### Held dependencies

The `list-outdated-deps` and `update-outdated-deps:update-versions` scripts in the root `package.json` exclude a few packages with `!<name>`, so they are never listed or bumped. Do NOT remove an exclusion without verifying its exit condition (`pnpm peers check`, then build and browse the affected sample). Entries marked permanent have no exit condition:

- **`@module-federation/*`** (held at 2.9.3) — permanent hold. `@squide/firefly-module-federation` and `@squide/firefly-rsbuild-configs` are in maintenance mode and no sample builds a federated application anymore, so only unit and snapshot tests would guard a bump. Do NOT release it.
- **`@opentelemetry/*`** — the web OpenTelemetry SDK that `@workleap/telemetry` installs requires `@opentelemetry/api` below 1.10, while the newer Node SDK packages of the `endpoints` express server require 1.10. Release them once `@workleap/telemetry` ships an SDK that accepts `@opentelemetry/api` 1.10.

## Adding a New Package

1. Create a folder under `packages/` matching the package name.
2. Run `pnpm init` inside it.
3. Name it with the `@squide/` scope (e.g., `@squide/foo`).
4. Set `"publishConfig": { "access": "public", "provenance": true, "registry": "https://registry.npmjs.org/" }`. Without `registry`, publishing targets the package firewall (see [GitHub package firewall](#github-package-firewall)).
5. Set `"sideEffects": false` (unless the package contains CSS or other side effects).
6. Add npm `dependencies` and `peerDependencies` to the **package's own** `package.json`.
7. Add `devDependencies` locally (not at root — pnpm doesn't hoist).

Follow the [Workleap GitHub guidelines](https://github.com/workleap/github-guidelines#npm-package-name)
for package naming, author, and license.

## Pre-Commit Hook

A Claude Code pre-commit hook (`.claude/hooks/pre-commit.sh`, configured in `.claude/settings.json`) runs `pnpm lint` before every `git commit`. Commits are blocked if lint fails. Run `pnpm oxfmt` and fix lint errors before committing — `pnpm lint` includes `oxfmt --check`.

## Full Command Reference

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install all dependencies |
| `pnpm build-pkg` | Build all publishable packages |
| `pnpm build-basic` | Build the basic sample |
| `pnpm build-endpoints` | Build the endpoints sample |
| `pnpm build-storybook` | Build the Storybook sample |
| `pnpm dev-basic` | Dev server for basic sample |
| `pnpm dev-endpoints` | Dev server for endpoints sample |
| `pnpm dev-storybook` | Dev server for Storybook sample |
| `pnpm dev-docs` | Retype documentation dev server |
| `pnpm serve-basic` | Build + serve basic sample locally |
| `pnpm serve-endpoints` | Build + serve endpoints sample locally |
| `pnpm serve-storybook` | Build + serve Storybook sample locally |
| `pnpm test` | Run unit tests |
| `pnpm lint` | Run oxlint + oxfmt check + typecheck + syncpack |
| `pnpm oxfmt` | Format the repo with oxfmt |
| `pnpm changeset` | Create a version changeset |
| `pnpm clean` | Delete dist folders and caches |
| `pnpm reset` | Full reset: dist, caches, node_modules |
| `pnpm list-outdated-deps` | Check for outdated dependencies |
| `pnpm update-outdated-deps` | Update outdated dependencies |
| `pnpm deploy-basic` | Deploy basic sample to Netlify |
| `pnpm deploy-endpoints` | Deploy endpoints sample to Netlify |

Dev servers serve at `http://localhost:8080/` by default.

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
