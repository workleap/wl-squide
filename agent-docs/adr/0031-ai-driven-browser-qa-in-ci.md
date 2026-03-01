# ADR-0031: AI-Driven Browser QA in CI (Smoke Test + Dogfood)

## Status

accepted

## Context

The endpoints sample app (`samples/endpoints/`) is the primary validation surface for Squide runtime behavior — routes, navigation, data fetching, module registration, and error boundaries all run there. Unit tests (Vitest) validate individual packages, but they cannot catch integration failures: a route that fails to render, a module that fails to register, or an error boundary that incorrectly suppresses an error only shows up in a real browser.

Two separate QA needs were identified:

1. **PR smoke test** — fast, deterministic check on PRs that affect packages or the endpoints app. Verifies all known pages render without JS errors. Needs to run in a few minutes and produce a clear PASS/FAIL signal.
2. **Periodic exploratory QA (dogfood)** — deeper, exploratory session that exercises user flows, detects regressions not covered by the smoke test, and captures issues for human review. Runs monthly, not on every PR.

## Options Considered

1. **Traditional browser testing (Playwright or Cypress)** — write deterministic test scripts for each page. Reliable and well-understood but requires maintaining test code as the app evolves. Every new page or interaction needs a corresponding test update. Does not discover unexpected issues — only validates what was explicitly scripted.

2. **AI-driven browser testing with `agent-browser`** — an AI agent uses `agent-browser` (a headless browser CLI) to navigate, inspect, and verify pages via text snapshots and console output. The agent interprets what it sees, adapts to the current UI, and can discover issues not anticipated by a fixed test script.

## Decision

Option 2, with the two use cases split into separate workflows:

- **`smoke-test.yml` + `smoke-test.md`** (ADR-0015 lean YML + prompt pattern): triggered on PRs to main affecting packages or the endpoints app. The agent navigates a fixed list of pages, captures `agent-browser snapshot -i` (text) and `agent-browser console` output, and ends with `SMOKE TEST PASSED` or `SMOKE TEST FAILED`. Max 50 turns. No screenshots.
- **`dogfood.yml` + `dogfood.md`** (same pattern): triggered on a monthly schedule (15th of each month) and on-demand. Runs an `agent-browser` dogfood session following the skill instructions in `SKILL.md` against a production-like build (`pnpm serve-endpoints`). Max 200 turns. Evidence (screenshots, videos) is persisted on a Git orphan branch for linkability from GitHub issues. Files a GitHub issue if issues are found, stops silently if none.

Evidence: `.github/workflows/smoke-test.yml`, `.github/workflows/dogfood.yml`, `.github/prompts/smoke-test.md`, `.github/prompts/dogfood.md`.

## Consequences

- No test code to maintain — the smoke test is defined as a page list in `smoke-test.md`. Adding a new page means adding one line to the prompt file.
- The dogfood session can discover issues outside the fixed page list, providing broader coverage.
- AI-driven tests are less deterministic than scripted tests. False positives (AI misreads the UI) are possible but expected to be rare for binary PASS/FAIL outcomes.
- Both workflows use `agent-browser install --with-deps` and `pnpm serve-endpoints` (production-like build). The dogfood session takes longer (~5–10 min including build and QA time) due to its exploratory nature vs the smoke test's fixed page list.
- Dogfood evidence is stored on the `dogfood-evidence` orphan branch so GitHub issue links remain stable across runs. See [ci-cd.md](../docs/references/ci-cd.md#dogfood-workflow) for operational details.
- Dogfood findings are filed as GitHub issues for human triage — the workflow does not block PRs or deployments.
