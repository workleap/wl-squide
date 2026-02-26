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
| endpoints (isolated) | `pnpm deploy-endpoints-isolated` | [squide-endpoints-remote-isolated.netlify.app](https://squide-endpoints-remote-isolated.netlify.app/) |

## Adding a New Package

1. Create a folder under `packages/` matching the package name.
2. Run `pnpm init` inside it.
3. Name it with the `@squide/` scope (e.g., `@squide/foo`).
4. Set `"publishConfig": { "access": "public" }`.
5. Set `"sideEffects": false` (unless the package contains CSS or other side effects).
6. Add npm `dependencies` and `peerDependencies` to the **package's own** `package.json`.
7. Add `devDependencies` locally (not at root — pnpm doesn't hoist).

Follow the [Workleap GitHub guidelines](https://github.com/workleap/github-guidelines#npm-package-name)
for package naming, author, and license.

## Claude Code Hooks

A pre-commit hook runs `pnpm lint` before every commit made through Claude Code. See `.claude/hooks/pre-commit.sh` for implementation details and caveats.

| File | Purpose |
|------|---------|
| `.claude/settings.json` | Registers a `PreToolUse` hook on the `Bash` tool |
| `.claude/hooks/pre-commit.sh` | Filters for `git commit` commands and runs `pnpm lint` |

## Full Command Reference

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install all dependencies |
| `pnpm build-pkg` | Build all publishable packages |
| `pnpm build-basic` | Build the basic sample |
| `pnpm build-basic-webpack` | Build the basic-webpack sample |
| `pnpm build-endpoints` | Build the endpoints sample |
| `pnpm build-storybook` | Build the Storybook sample |
| `pnpm dev-basic` | Dev server for basic sample |
| `pnpm dev-basic-webpack` | Dev server for basic-webpack sample |
| `pnpm dev-endpoints` | Dev server for endpoints sample |
| `pnpm dev-storybook` | Dev server for Storybook sample |
| `pnpm dev-docs` | Retype documentation dev server |
| `pnpm serve-basic` | Build + serve basic sample locally |
| `pnpm serve-basic-webpack` | Build + serve basic-webpack sample locally |
| `pnpm serve-endpoints` | Build + serve endpoints sample locally |
| `pnpm serve-storybook` | Build + serve Storybook sample locally |
| `pnpm test` | Run unit tests |
| `pnpm lint` | Run ESLint + typecheck + syncpack |
| `pnpm changeset` | Create a version changeset |
| `pnpm clean` | Delete dist folders and caches |
| `pnpm reset` | Full reset: dist, caches, node_modules |
| `pnpm list-outdated-deps` | Check for outdated dependencies |
| `pnpm update-outdated-deps` | Update outdated dependencies |
| `pnpm deploy-basic` | Deploy basic sample to Netlify |
| `pnpm deploy-endpoints` | Deploy endpoints sample to Netlify |
| `pnpm deploy-endpoints-isolated` | Deploy endpoints isolated to Netlify |

Dev servers serve at `http://localhost:8080/` by default.

---
*See [AGENTS.md](../../../AGENTS.md) for navigation.*
