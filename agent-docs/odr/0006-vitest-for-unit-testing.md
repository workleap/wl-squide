# ODR-0006: Vitest for Unit Testing

## Status

proposed

## Context

The monorepo originally used Jest with SWC transforms (`swc.jest.ts`) for unit testing. Jest required additional configuration for ESM support, TypeScript transforms, and React JSX — each adding complexity. As the project moved to ESM-only output (ADR-0011) and Rsbuild/Rslib for builds (ODR-0002), the Jest+SWC toolchain became increasingly misaligned with the rest of the build infrastructure.

## Options Considered

1. **Keep Jest with SWC** — Familiar, large ecosystem, but ESM support is experimental, requires separate transform configuration, and diverges from the Vite/Rsbuild ecosystem.
2. **Vitest** — Native ESM support, Vite-based transforms, compatible with the project's `@vitejs/plugin-react`, and per-package configuration via `vitest.config.ts`. Shares the same transform pipeline as the build tooling.
3. **Node.js native test runner** — Zero dependencies, but lacks React component testing support, no built-in DOM environment, and limited assertion library.

## Decision

Option 2. Every testable package has its own `vitest.config.ts`. Packages opt into `happy-dom` as the test environment when needed (most packages use it); packages that test pure logic with no DOM dependency omit it. Packages with React component tests add a `vitest-setup.ts` that calls `cleanup()` from `@testing-library/react` after each test.

Evidence: `packages/firefly/vitest.config.ts` configures `environment: "happy-dom"` with `setupFiles: ["./vitest-setup.ts"]`. `packages/core/vitest.config.ts` runs without a DOM environment. Migration was done in commit `b4d9c9e94` ("Migrate to Vitest").

## Consequences

- ESM support works natively without experimental flags or transform workarounds.
- The test transform pipeline aligns with the build tooling (both Vite-based).
- Per-package configuration allows packages to opt into DOM environments only when needed, keeping pure-logic tests fast.
- `happy-dom` is lighter than `jsdom`, improving test execution speed for component tests.
