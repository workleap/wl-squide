# ODR-0009: AI-Driven Browser QA in CI (Smoke Test)

## Status

accepted

## Context

The endpoints sample app (`samples/endpoints/`) is the primary validation surface for Squide runtime behavior — routes, navigation, data fetching, module registration, and error boundaries all run there. Unit tests (Vitest) validate individual packages, but they cannot catch integration failures: a route that fails to render, a module that fails to register, or an error boundary that incorrectly suppresses an error only shows up in a real browser.

Two separate QA needs were identified:

1. **PR smoke test** — fast, deterministic check on PRs that affect packages or the endpoints app. Verifies all known pages render without JS errors. Needs to run in a few minutes and produce a clear PASS/FAIL signal.
2. **Periodic exploratory QA (dogfood)** — no longer pursued; the dogfood workflow was removed. Was: deeper, exploratory session that exercises user flows, detects regressions not covered by the smoke test, and captures issues for human review. Runs monthly, not on every PR.

## Options Considered

1. **Traditional browser testing (Playwright or Cypress)** — write deterministic test scripts for each page. Reliable and well-understood but requires maintaining test code as the app evolves. Every new page or interaction needs a corresponding test update. Does not discover unexpected issues — only validates what was explicitly scripted.

2. **AI-driven browser testing with `agent-browser`** — an AI agent uses `agent-browser` (a headless browser CLI) to navigate, inspect, and verify pages via text snapshots and console output. The agent interprets what it sees, adapts to the current UI, and can discover issues not anticipated by a fixed test script.

## Decision

Option 2, applied as a PR smoke test:

- **`smoke-test.yml` + `smoke-test.md`** (ODR-0004 lean YML + prompt pattern): triggered on PRs to main affecting packages or the endpoints app. The agent navigates a fixed list of pages, captures `agent-browser snapshot -i` (text) and `agent-browser console` output, and ends with `SMOKE TEST PASSED` or `SMOKE TEST FAILED`. Max 50 turns. No screenshots.
- **Dogfood (removed)**: a monthly `dogfood.yml` + `dogfood.md` workflow ran an exploratory `agent-browser` session and filed GitHub issues. It has since been removed; only the PR smoke test remains.

Evidence: `.github/workflows/smoke-test.yml`, `.github/prompts/smoke-test.md`.

## Consequences

- No test code to maintain — the smoke test is defined as a page list in `smoke-test.md`. Adding a new page means adding one line to the prompt file.
- AI-driven tests are less deterministic than scripted tests. False positives (AI misreads the UI) are possible but expected to be rare for binary PASS/FAIL outcomes.
- The smoke test uses `agent-browser install --with-deps` and `pnpm serve-endpoints` (production-like build).
