# Release Process

## Overview

wl-squide uses [Changesets](https://github.com/changesets/changesets) for version management.

## Steps

1. **Create changeset** — `pnpm changeset` to describe the change and affected packages.
2. **Merge to main** — the changeset file is committed with the PR.
3. **Changeset workflow** — `.github/workflows/changeset.yml` detects pending changesets and
   creates a "Version Packages" PR that bumps versions and updates changelogs.
4. **Merge version PR** — merging publishes packages to npm.

## Configuration

- `.changeset/config.json` — changeset settings
- Publish registry — the repository `.npmrc` points at the GitHub package firewall, so each published package sets `publishConfig.registry` to `https://registry.npmjs.org/`, and `changeset.yml` sets `pnpm_config_registry` on the `changesets/action` step: `changeset publish` checks existing versions with `pnpm info` against the repository registry and ignores `publishConfig.registry`. Keep both when adding a package or editing the workflow. See [development.md](./development.md#github-package-firewall)
- Version consistency enforced by Syncpack (`.syncpackrc.js`)

## PR Preview Packages

The `pr-pkg.yml` workflow publishes preview packages from PRs for testing.

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
