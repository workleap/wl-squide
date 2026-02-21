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
- `pnpm-workspace.yaml` — `minimumReleaseAge: 1440` (24-hour delay before release)
- Version consistency enforced by Syncpack (`.syncpackrc.js`)

## PR Preview Packages

The `pr-pkg.yml` workflow publishes preview packages from PRs for testing.

---
*See [AGENTS.md](../../../AGENTS.md) for navigation.*
