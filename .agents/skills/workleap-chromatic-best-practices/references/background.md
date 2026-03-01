# Chromatic Background and Monorepo Guide

Context on why each Chromatic best practice matters, and additional checks for monorepo projects.

## TurboSnap Preservation

TurboSnap analyzes Git changes to snapshot only affected stories. These patterns disable TurboSnap and trigger full builds (all stories):

| Change Type | Files |
|-------------|-------|
| Storybook preview | `.storybook/preview.ts[x]` |
| Barrel file dependencies | Any `index.ts[x]` imported by preview |
| Package dependencies | `**/package.json` (optionally use `untraced`) |
| Large shared files | Routes, constants, localization |
| Shallow git clone | Missing `fetch-depth: 0` |

## Snapshot Cost Multipliers

| Configuration | Snapshots per Story |
|---------------|---------------------|
| Chrome only | 1x |
| Chrome + Safari | 2x |
| Chrome + Safari + Firefox | 3x |

## CI Trigger Strategy

Running Chromatic on every PR commit wastes snapshots on work-in-progress:
- Use `run chromatic` label to trigger workflow
- Auto-remove label after completion
- Make workflow a required status check to remind reviewers

## Monorepo-Specific Audit

For Turborepo/monorepo projects, apply these additional checks:

### 1. Per-Package Chromatic Configs

Each package with Storybook should have its own `chromatic.config.json`.

### 2. Turborepo Cache in CI

Workflow should restore/save Turborepo cache:

```yaml
- name: Restore Turborepo cache
  uses: actions/cache/restore@v5
  with:
    key: ${{ runner.os }}-turbo-chromatic-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-turbo-chromatic-
      ${{ runner.os }}-turbo-
    path: .turbo
```

### 3. Module-Level Triggering

For modular architecture, configure CI to run Chromatic only for affected modules.
