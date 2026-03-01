# ADR-0028: useSyncExternalStore for State Reactivity

## Status

accepted

## Context

Squide's runtime manages external state (module registration status, MSW readiness, feature flag snapshots) that React components need to subscribe to. The original implementation used `setInterval` polling to detect state changes, which introduced unnecessary latency, wasted CPU cycles, and could miss rapid state transitions between polling intervals.

## Options Considered

1. **`setInterval` polling** — Periodically check external state. Simple but introduces latency (state changes are only detected at the next poll interval), wastes CPU with unnecessary checks, and can cause stale renders.
2. **Custom event emitter with `useState`** — External state emits events, and React components update `useState` in event handlers. Works but requires careful cleanup, risks tearing (reading inconsistent state during concurrent rendering), and duplicates React's own subscription pattern.
3. **`useSyncExternalStore`** — React's built-in hook designed specifically for subscribing to external stores. Guarantees consistency during concurrent rendering, provides a standardized subscribe/getSnapshot contract, and is tearing-safe.

## Decision

Option 3. All external state subscriptions use React's `useSyncExternalStore`. State classes expose a listener-based API (e.g., `addMswReadyListener`/`removeMswReadyListener` on `MswState`, `addSnapshotChangedListener`/`removeSnapshotChangedListener` on `FeatureFlagSetSnapshot`). Components subscribe via `useSyncExternalStore(subscribe, getSnapshot)` where `subscribe` wires up the listener and `getSnapshot` returns the current value.

Evidence: `packages/firefly/src/useStrictRegistrationMode.ts` uses `useSyncExternalStore` to subscribe to `runtime.moduleManager.getAreModulesReady()`. `packages/launch-darkly/src/useFeatureFlag.ts` uses `useSyncExternalStore` to subscribe to individual flag changes. `packages/launch-darkly/src/FeatureFlagSetSnapshot.ts` maintains a stable snapshot object specifically because the LaunchDarkly client's `allFlags()` always returns a new object reference, which would cause infinite loops with `useSyncExternalStore`.

## Consequences

- State changes are detected immediately (no polling delay).
- Tearing-safe during React concurrent rendering — components always see a consistent snapshot.
- External state classes must maintain stable references for their snapshot values (e.g., `FeatureFlagSetSnapshot` caches the flags object).
- The `subscribe`/`getSnapshot` contract standardizes how all external state integrates with React across the codebase.
