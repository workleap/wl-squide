# Testing & Validation

## How to Validate Changes

Run these steps in order before considering a change complete:

1. **Lint** — `pnpm lint` (runs ESLint, typecheck, and syncpack in parallel)
2. **Test** — `pnpm test` (runs Vitest across all packages)
3. **Browser validation** — validate sample apps in a real browser (see below)

All three must pass with zero errors.

For a failing package, run its tests directly for clearer output:

```bash
pnpm turbo run test --filter=@squide/core
```

## Browser Validation

Use **pnpx agent-browser** (see `.agents/skills/agent-browser/`) to validate sample apps. A build alone is not sufficient — you must start the dev server and verify pages in a real browser.

### Endpoints sample (`pnpm dev-endpoints`)

1. Start the dev server in the background: `pnpm dev-endpoints`
2. Wait for the server to be ready (watch output for a URL like `http://localhost:<port>`)
3. Navigate to each page and verify it renders without errors:
   - `/`
   - `/subscription`
   - `/federated-tabs`
   - `/federated-tabs/episodes`
   - `/federated-tabs/locations`
4. Check console messages for errors (ignore warnings and network errors from fake APIs or MSW)
5. Stop the dev server when done

### Storybook sample (`pnpm dev-storybook`)

1. Start the dev server in the background: `pnpm dev-storybook`
2. Wait for the server to be ready
3. Navigate to the Storybook URL and verify it loads correctly
4. Check console messages for errors
5. Stop the dev server when done

## Test Infrastructure

- **Vitest** — each package has its own `vitest.config.ts`
- Tests live in `packages/<name>/tests/` following `**/*.test.{ts,tsx}`
- `@vitejs/plugin-react` for React support in tests
- CI runs tests incrementally on PRs (only diverging packages) and fully on main

---
*See [AGENTS.md](../../../AGENTS.md) for navigation.*
