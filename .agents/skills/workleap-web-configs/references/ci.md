# CI Workflow

## Overview

Workleap solutions validate their shared configurations through a GitHub Actions workflow at `.github/workflows/ci.yml`. Protect the `main` branch with a branch rule so the workflow must pass before merging.

Pick the polyrepo variant for a single-project repository and the Turborepo variant for a monorepo.

## Polyrepo

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch:

env:
  CI: true

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v7

      - name: Install pnpm
        uses: pnpm/action-setup@v6
        with:
          run_install: false

      - name: Install Node.js
        uses: actions/setup-node@v7
        with:
            node-version: ">=26.0.0"
            check-latest: true
            cache: pnpm
            cache-dependency-path: pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build apps or packages
        run: pnpm build

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test
```

## Turborepo

The monorepo workflow adds three things: a full-depth checkout (required by the Turborepo Git filters), a restored/saved `.turbo` cache, and per-task steps that only run against the projects diverging from the pull request baseline.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch:

env:
  CI: true

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v7
        with:
          # Required for the Turborepo Git filters.
          fetch-depth: 0

      - name: Install pnpm
        uses: pnpm/action-setup@v6
        with:
          run_install: false

      - name: Install Node.js
        uses: actions/setup-node@v7
        with:
          node-version: ">=26.0.0"
          check-latest: true
          cache: pnpm
          cache-dependency-path: pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Restore Turborepo cache
        id: cache-turborepo-restore
        uses: actions/cache/restore@v6
        with:
          key: ${{ runner.os }}-turbo-ci-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-turbo-ci-
            ${{ runner.os }}-turbo-
          path: .turbo

      - name: Build apps or packages
        # For a PR, only build the host if it's diverging from the pull request original baseline.
        run: |
          if [ "${{ github.event_name }}" == "pull_request" ]; then
              pnpm turbo run build --filter={YOUR_FILTER}...[${{ github.event.pull_request.base.sha }}]
          else
              pnpm turbo run build --filter=YOUR_FILTER
          fi

      - name: ESLint
        run: |
          if [ "${{ github.event_name }}" == "pull_request" ]; then
              pnpm turbo run eslint --continue --filter=...[${{ github.event.pull_request.base.sha }}]
          else
              pnpm turbo run eslint --continue
          fi

      - name: Stylelint
        run: |
          if [ "${{ github.event_name }}" == "pull_request" ]; then
              pnpm turbo run stylelint --continue --filter=...[${{ github.event.pull_request.base.sha }}]
          else
              pnpm turbo run stylelint --continue
          fi

      - name: Typecheck
        run: |
          if [ "${{ github.event_name }}" == "pull_request" ]; then
              pnpm turbo run typecheck --continue --filter=...[${{ github.event.pull_request.base.sha }}]
          else
              pnpm turbo run typecheck --continue
          fi

      - name: Syncpack
        run: pnpm turbo run syncpack

      - name: Test packages
        run: |
            if [ "${{ github.event_name }}" == "pull_request" ]; then
                pnpm turbo run test --continue --force --filter=...[${{ github.event.pull_request.base.sha }}]
            else
                pnpm turbo run test --continue --force
            fi

      - name: Save Turborepo cache
        id: cache-turborepo-save
        if: always() && steps.cache-turborepo-restore.outputs.cache-hit != 'true'
        uses: actions/cache/save@v6
        with:
          key: ${{ steps.cache-turborepo-restore.outputs.cache-primary-key }}
          path: .turbo
```

Add project-specific validation steps between the `Restore Turborepo cache` and `Save Turborepo cache` steps so they benefit from the cache.

## Verifying the cache

Push a trivial change that shouldn't affect the build output and re-run the workflow. The logs should report a Turborepo cache hit:

```text
Cache hit for: Linux-turborepo-284bb4311b5346b0e97e839c74dd0775e07da29c
Cache restored successfully
```
