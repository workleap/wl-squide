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

Option 3. Cache keys are SHA-based (e.g., `${{ runner.os }}-turbo-ci-${{ github.sha }}`). Restore-keys cascade across workflow types (`turbo-ci-` → `turbo-`), enabling cross-workflow cache sharing. The save step runs with `if: always() && cache-hit != 'true'` to ensure caches are written even if later steps fail.

Evidence: `ci.yml` comments: "Using SHA will usually provide cache hit on subsequent commits in a PR but will not provide cache hits between PRs." All workflows use this split restore/save pattern.

## Consequences

- No vendor lock-in — cache data stays within GitHub's infrastructure.
- Cross-workflow cache sharing (a CI run can warm from a changeset run's cache).
- Cache is saved even on partial failures, maximizing reuse.
- First PR run typically has cache misses (SHA-based keys don't match across PRs).
