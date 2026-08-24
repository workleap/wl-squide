# ADR-0022: Deferred Registration Update Runs Report and Validate Like the Bootstrap Path

## Status

proposed

## Context

Deferred registrations execute twice in an application's life. Once during bootstrap, as phase 2 of the two-phase registration described in [ADR-0001](./0001-two-phase-registration.md), and again every time `updateDeferredRegistrations` is called — a feature flag flip, a LaunchDarkly change, a refetched query.

The two paths use different navigation item scopes. Bootstrap uses `NavigationItemDeferredRegistrationScope`, which writes straight through to the registry. An update run uses `NavigationItemDeferredRegistrationTransactionalScope`, which buffers every item, clears the deferred state, then replays the buffer when the scope completes. The replay exists because a deferred function must be able to *stop* registering an item, which a write-through scope cannot express.

Buffering makes the outcome of a registration unknowable at the moment `registerNavigationItem` returns, and the transactional scope resolved that by declaring the outcome in advance: it returned `registrationStatus: "registered"` unconditionally, justified by a comment asserting that an update run can never leave a registration pending.

That invariant does not hold. A nested item whose section is not re-registered by the run stays pending after the replay. Issue [#658](https://github.com/workleap/wl-squide/issues/658) reported the consequences, and two independent asymmetries against the bootstrap path came out of it:

- **Reporting.** An item that is only buffered is logged as `registered`. The replay in `complete()` calls `NavigationItemRegistry.add` directly, bypassing the logging in `ReactRouterRuntime`, so it emits nothing — the real outcome is never reported at all. An application whose sidebar silently loses a link sees a green "registered" line and no warning.
- **Validation.** `_validateRegistrations` runs once. `useStrictRegistrationMode` drives it off the modules-ready external store, `registerModulesReadyListener` removes the callback before invoking it, and neither `LocalModuleRegistry.updateDeferredRegistrations` nor its remote equivalent re-notifies the store. An item left pending by an update run therefore surfaces only on a fresh mount, which for `AppRouter` means a page reload.

The result is that the update path is strictly weaker than the register path, which is the asymmetry #658 is about.

## Options Considered

1. **Leave the update path silent.** Status quo. Zero risk, but silent navigation corruption stays undiagnosable, and the "registered" log actively misleads whoever is debugging it.
2. **Report accurately, never validate on the update path.** Fixes the lie without adding a failure mode. Cheap, but leaves the update path permanently weaker than bootstrap — an application can still lose a whole section with nothing louder than a debug line.
3. **Validate inside the module manager and surface failures in the `ModuleRegistrationError[]` returned by `updateDeferredRegistrations`.** The genuinely catchable channel, and applications already wire `onError` in `useDeferredRegistrations`. But it puts navigation item knowledge into `@squide/core`'s module manager, which today knows nothing about registries, and it redefines the returned array from "errors thrown by module registration functions" to "that, plus framework validation findings".
4. **Re-validate from `useStrictRegistrationMode`, triggered by the already-dispatched `DeferredRegistrationsUpdateCompletedEvent`.** Development throws, production logs — the same severity contract as bootstrap, driven by the same hook and disabled by the same `strictMode={false}` opt-out.

## Decision

**Option 4, together with accurate reporting.**

Three changes follow from it.

**The registration status gained a third value.** `NavigationItemRegistrationStatus` is now `"pending" | "registered" | "buffered"`. The transactional scope returns `"buffered"`, which is what actually happened, and `#logNavigationItemRegistrationResult` gained a third arm that says so. This type is exported but unreachable by consumers — `registerNavigationItem` returns `void` and `_navigationItemRegistry` is `protected` with no public accessor — so widening it is a type-only change to an unreachable union rather than a breaking change.

**`complete()` returns the replay results.** `completeDeferredRegistrationScope` logs each one through the same function that logs a static registration, so an item left pending by the replay now produces the ordinary yellow `pending until the "x" section of the "y" menu is registered` line instead of nothing.

**Validation re-fires from a React effect, not from the event bus listener.** This distinction is the reason option 4 is safe, and it is easy to undo by accident. `DeferredRegistrationsUpdateCompletedEvent` is dispatched from inside the async callback returned by `useUpdateDeferredRegistrations`, which `useDeferredRegistrations` invokes bare. Throwing directly from the listener would surface as an unhandled promise rejection: no React overlay, no unmount, a console line most applications swallow. So the listener only increments a counter, and a `useEffect` keyed on that counter runs the validation. A throw from an effect is what the bootstrap path already does, which is why this introduces no new failure mode.

**Routes are excluded from the re-validation.** `_validateRegistrations` gained an `includeRoutes` option, defaulted to `true` and passed as `false` on the update path. Routes are frozen after phase 1 ([ADR-0001](./0001-two-phase-registration.md)), so route pending state cannot change during an update run. Re-running route validation could only re-throw a bootstrap misconfiguration on every flag flip, and it would throw the "ProtectedRoutes outlet is missing" error for any runtime that has no router at all.

Option 3 was not taken, and is deliberately left available. It is the only genuinely catchable channel, and if an application needs to handle a failed update run rather than fail loudly on it, that is the shape to build. It was rejected here because it changes the meaning of a `@squide/core` return value to solve a problem the existing strict mode hook already solves with no new concepts. Applications that want it today can listen to `DeferredRegistrationsUpdateCompletedEvent` themselves and call `runtime._validateRegistrations({ includeRoutes: false })` inside their own error handling.

Evidence: `packages/react-router/src/NavigationItemRegistry.ts` (the transactional scope and its `complete` return value), `packages/react-router/src/ReactRouterRuntime.ts` (`completeDeferredRegistrationScope`, `#logNavigationItemRegistrationResult`, `_validateRegistrations`), `packages/firefly/src/useStrictRegistrationMode.ts` (the counter and the effect).

## Consequences

- A deferred registration update run now reports what actually happened. An item left pending by a replay is visible in the console at the moment it happens rather than after a page reload.
- Strict mode has the same severity on both paths: development throws, production logs. `strictMode={false}` remains the single opt-out for both.
- Applications that were silently losing navigation items on a flag flip will start throwing in development. This is the intended outcome, and it will surface pre-existing misconfigurations that were previously invisible. It is gated on development mode, so production behaviour changes to a logged error only.
- Validation runs on every completed update run. It walks the pending index only, so the cost is proportional to the number of unresolved registrations, which is normally zero.
- `_validateRegistrations` is no longer all-or-nothing. `includeRoutes` is a new seam, and a future caller that wants navigation-only validation has it.
- The re-validation depends on `DeferredRegistrationsUpdateCompletedEvent` being dispatched. An application that calls `runtime.moduleManager.updateDeferredRegistrations` directly, bypassing `useUpdateDeferredRegistrations`, does not get re-validated.
- The trailing `-started` in the `DeferredRegistrationsUpdateCompletedEvent` string value is now load-bearing for strict mode. It remains a typo, and correcting the value stays a breaking change for anyone listening to it.
