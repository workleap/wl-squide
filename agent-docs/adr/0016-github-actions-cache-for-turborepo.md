# ADR-0016: GitHub Actions Cache for Turborepo (Not Vercel Remote Cache)

## Status

accepted

## Context

Turborepo's caching is essential for CI performance in this monorepo. Turborepo offers a built-in remote cache service (Vercel Remote Cache), but GitHub Actions also has its own caching mechanism.

## Options Considered

1. **Turborepo Remote Cache (Vercel)** — Official solution. Seamless integration but adds vendor dependency and sends cache data to Vercel's infrastructure.
2. **GitHub Actions cache with combined action** — Use `actions/cache` (restore + save in one step). Simpler but less control over save conditions.
3. **GitHub Actions cache with split restore/save** — Use `actions/cache/restore` and `actions/cache/save` as separate steps. SHA-based keys with cascading restore-keys for cross-workflow sharing.

## Decision

Option 3. Four workflows use this pattern: `ci.yml`, `changeset.yml`, `pr-pkg.yml`, and `claude.yml`. Each has a workflow-specific cache key prefix (`turbo-ci-`, `turbo-changeset-`, `turbo-pr-pkg-`, `turbo-claude-`).

Cache keys are SHA-based (e.g., `${{ runner.os }}-turbo-ci-${{ github.sha }}`). Restore-keys use a 2-level cascade:
1. **Same workflow, any SHA:** `${{ runner.os }}-turbo-ci-` — matches previous runs of the same workflow.
2. **Any workflow:** `${{ runner.os }}-turbo-` — falls back to any Turborepo cache from any workflow.

The save step runs with `if: always() && cache-hit != 'true'` to ensure caches are written even if later build/test steps fail, and to skip saving when an exact cache hit was already found.

A trailing-hyphen bug (PR #372, commit `2749c2870`) demonstrated why the cascade prefix formatting matters: without the trailing hyphen on the first restore-key (e.g., `turbo-ci` instead of `turbo-ci-`), GitHub Actions' prefix matching could match keys from other workflows (e.g., `turbo-changeset-abc123`), defeating the purpose of workflow-specific caching.

Evidence: `ci.yml` (lines 45-56 restore, 133-139 save), `changeset.yml` (lines 41-52 restore, 58-63 save), `pr-pkg.yml` (lines 43-53 restore, 59-64 save), `claude.yml` (lines 49-57 restore, 66-72 save). All contain the comment: "Using SHA will usually provide cache hit on subsequent commits in a PR but will not provide cache hits between PRs."

## Consequences

- No vendor lock-in — cache data stays within GitHub's infrastructure.
- Cross-workflow cache sharing via the 2-level restore-key cascade (a CI run can warm from a changeset run's cache).
- Cache is saved even on partial failures, maximizing reuse for the next run.
- First PR run typically has cache misses (SHA-based keys don't match across PRs), but the cross-workflow fallback mitigates this.
- The trailing-hyphen lesson underscores the importance of consistent key prefix formatting in GitHub Actions cache restore-keys.
