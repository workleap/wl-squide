# Testing & Validation

## How to Validate Changes

Never declare a change complete without passing all three steps in order:

1. **Lint** — `pnpm lint` (runs ESLint, typecheck, and syncpack in parallel)
2. **Test** — `pnpm test` (runs Vitest across all packages)
3. **Browser validation** — validate sample apps in a real browser (see below)

Lint and test passing is necessary but NOT sufficient — changes that affect routes, navigation, data fetching, or module registration MUST be browser-validated. A build-only check will miss rendering failures.

For a failing package, run its tests directly for clearer output:

```bash
pnpm turbo run test --filter=@squide/core
```

## Browser Validation

Use **agent-browser** (see `.agents/skills/agent-browser/`) to validate sample apps. It is installed as a workspace devDependency. A build alone is not sufficient — you must start the dev server and verify pages in a real browser.

### Endpoints sample (`pnpm dev-endpoints`)

1. Start the dev server in the background: `pnpm dev-endpoints`
2. The app listens on port **8080**. Wait for it to be ready: `curl --retry 30 --retry-delay 5 --retry-connrefused --silent --output /dev/null http://localhost:8080`
3. The app has a mock login page. Use username `temp` and password `temp` to authenticate.
4. Navigate to each page and verify it renders without errors:
   - `/` (Home page)
   - `/subscription`
   - `/federated-tabs`
   - `/federated-tabs/episodes`
   - `/federated-tabs/locations`
5. Check console messages for errors (ignore warnings and network errors from fake APIs or MSW)
6. Stop the dev server when done: `kill $(lsof -t -i:8080) 2>/dev/null || true`

### Storybook sample (`pnpm dev-storybook`)

1. Start the dev server in the background: `pnpm dev-storybook`
2. The app listens on port **6006**. Wait for it to be ready: `curl --retry 30 --retry-delay 5 --retry-connrefused --silent --output /dev/null http://localhost:6006`
3. Navigate to http://localhost:6006 and verify it loads correctly
4. Click on at least 2 different stories and verify each renders without errors
5. Check console messages for errors (ignore warnings and known noise)
6. Stop the dev server when done: `kill $(lsof -t -i:6006) 2>/dev/null || true`

## Test Infrastructure

- **Vitest** — each package has its own `vitest.config.ts`
- Tests live in `packages/<name>/tests/` following `**/*.test.{ts,tsx}`
- `@vitejs/plugin-react` for React support in tests
- CI runs tests incrementally on PRs (only diverging packages) and fully on main

---
*See [AGENTS.md](../../../AGENTS.md) for navigation.*
