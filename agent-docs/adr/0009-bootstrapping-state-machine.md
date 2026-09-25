# ADR-0009: Framework-Level Bootstrapping State Machine

## Status

accepted

## Context

A Squide application has a complex async startup lifecycle: module registration, MSW initialization, route visibility detection, public data fetch, protected data fetch, deferred registrations, and finally rendering. Each step has ordering dependencies on previous steps. For example, public data must be fetched before determining whether the user is authenticated, which gates protected data fetching, which gates deferred registrations (which may register navigation items based on server data — see ADR-0001).

Beyond React components, non-React consumers need to observe the bootstrapping state. Platform Widgets (standalone scripts injected into pages) and Honeycomb instrumentation (ADR-0003) need to know when modules are registered or when the app is fully bootstrapped — without being inside a React render tree.

## Options Considered

1. **Simple boolean loading flag** — Insufficient for the number of async steps with inter-dependencies.
2. **React Suspense boundaries** — Suspense-based orchestration for each phase. Couples lifecycle to React rendering, excluding non-React consumers.
3. **Formal state machine library** — XState or similar. Adds a dependency for something that can be modeled with a reducer.
4. **AppRouter reducer with compound state** — A React `useReducer` with one action type per lifecycle phase, plus a parallel plain-class store for non-React consumers.

## Decision

Option 4. The `AppRouterReducer` manages the following lifecycle ordering:

1. `modules-registered` — All module `register()` functions have completed.
2. `msw-ready` — MSW service worker is active (or skipped if `useMsw: false`).
3. `plugins-ready` — Every plugin implementing the optional readiness surface of `Plugin` (`isReady()`, `registerReadyListener()`, `removeReadyListener()`) reports ready. Plugins without the surface always count as ready, and the action is only replayed at initialization when at least one plugin implements the surface, so an application without such plugins observes the same events as before. The i18next plugin uses it to hold rendering until the resources of the current language are loaded (ADR-0010).
4. `modules-ready` — The combined gate: modules registered + deferred registrations registered.
5. `active-route-is-public` / `active-route-is-protected` — The framework knows whether the active route is public or protected.
6. `public-data-ready` — Global public data queries have resolved.
7. `protected-data-ready` — Global protected data queries have resolved (only for authenticated users).
8. `is-unauthorized` — A global data query returned a 401, the login page must render.
9. `deferred-registrations-updated` — Deferred registration functions have re-executed with fresh data.
10. `feature-flags-updated` — LaunchDarkly flags have changed (if enabled).

The `useIsBootstrapping` hook computes readiness from this compound state — it returns `true` until all required phases for the current context (public vs. protected) have completed. Plugin readiness gates both exits of the hook: the normal one and the 401 flush, because the login page lives in a module whose plugins (i18next resources) must be ready too.

**Every readiness input is a one-way latch.** `modules-registered`, `modules-ready`, `msw-ready`, `plugins-ready`, `public-data-ready` and `protected-data-ready` only ever move to ready. Later changes are reported through `*-updated` timestamps, never by dispatching un-readiness: a flag flipping back would show the bootstrapping fallback over an already rendered page. A plugin implementing the readiness surface must honor the same rule, and must flip its latch when its work fails, otherwise the application is pinned on its fallback.

**Firefly consumes plugin readiness through the generic surface on `Plugin`, and `@squide/core` and `@squide/firefly` never import `@squide/i18next`.** Importing it would push three peer dependencies (`i18next`, `react-i18next`, `i18next-browser-languagedetector`) onto every firefly consumer. Any plugin with asynchronous bootstrap work goes through the same three methods.

Deferred registrations and global data fetching do **not** wait on plugin readiness (`useCanRegisterDeferredRegistrations`, `useCanFetchPublicData` and `useCanFetchProtectedData` are unchanged). The host's deferred registration is where the i18next plugin switches to the session's preferred language; gating it on readiness would serialize two loads.

A parallel `AppRouterStore` (plain class, not a React hook) provides identical state to non-React consumers via the event bus (ADR-0003). Every reducer action is mirrored to the event bus as `"squide-${action.type}"`, so Honeycomb instrumentation can build OpenTelemetry traces of the bootstrapping sequence without coupling to React. The `useExecuteOnce` utility ensures initial state synchronization between the React reducer and the store — actions dispatched before the React tree mounts are replayed to the reducer on first render.

Evidence: `packages/firefly/src/AppRouterReducer.ts` (`AppRouterActionType` lists the 13 action types, `useEnhancedReducerDispatch` mirrors each action to the store and the event bus, `usePluginsReadinessDispatcher` subscribes to the not-ready plugins). `packages/firefly/src/useIsBootstrapping.ts` combines the boolean conditions, `arePluginsReady` included on both exits. `packages/firefly/src/AppRouterStore.ts` provides the non-React parallel. `packages/firefly/src/useExecuteOnce.ts` handles initial state sync. `packages/core/src/plugins/Plugin.ts` declares the readiness surface. `packages/firefly/tests/eventSequence.test.tsx` ("msw + local modules + readiness-aware plugin") covers the gate.

## Consequences

- Every state transition is explicit and debuggable — logged at debug level and dispatched as events on the event bus.
- `useIsBootstrapping` is the single source of truth for "can we render the page."
- The dual reducer + store architecture ensures both React and non-React consumers observe the same lifecycle. The store will eventually replace the reducer entirely.
- The lifecycle ordering is documented implicitly by the action types — adding a new phase means adding a new action type and updating `useIsBootstrapping`.
- A plugin can hold rendering without firefly knowing the plugin: implement the readiness surface. It cannot un-ready the application afterwards.
- `squide-plugins-ready` may be dispatched before `squide-modules-registered`: a plugin subscribes to the module registries from its constructor, before the `AppRouter` effects do. Consumers must not assume an order between the two.
