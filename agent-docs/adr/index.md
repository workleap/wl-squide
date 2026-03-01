# Architectural Decisions

> Quick-reference for agents. Each line is a deliberate decision — read the linked ADR only if you need the full rationale.

| Decision | ADR |
|---|---|
| Routes are frozen after Phase 1 bootstrap. Deferred functions can register/update navigation items only — never routes. | [0001](./0001-two-phase-registration.md) |
| Modules receive a scoped `RuntimeScope` proxy, not the raw runtime. Access to `moduleManager`, registration scopes, and internal stores is restricted. | [0002](./0002-centralized-firefly-runtime.md) |
| Modules communicate via the event bus or plugins. Direct imports between feature modules are forbidden. Internal lifecycle events use the `"squide-"` prefix. | [0003](./0003-event-bus-cross-module-communication.md) |
| Plugins are instantiated as factory functions `(runtime) => new Plugin(runtime)`. No post-construction `_setRuntime()`. | [0004](./0004-plugin-system-factory-functions.md) |
| Routes default to `$visibility: "protected"`. A route is public only when explicitly set to `$visibility: "public"`. This is a security decision. | [0005](./0005-protected-by-default-route-visibility.md) |
| Late-arriving module registrations are queued until bootstrap completes, then flushed in order. | [0006](./0006-pending-registration-queue.md) |
| Module Federation is encapsulated in `@squide/firefly-module-federation`. Core packages have zero federation knowledge. Local and remote modules use identical APIs. | [0007](./0007-module-federation-as-optional-plugin.md) |
| Environment variables are registered via `EnvironmentVariablesPlugin` on `FireflyRuntime` — never read from `process.env`. This keeps Module Federation scenarios working. | [0008](./0008-environment-variables-on-runtime.md) |
| Bootstrapping progresses through a deterministic state machine: `idle → registering → registered → ready`. | [0009](./0009-bootstrapping-state-machine.md) |
| i18n instances are registered on the runtime via a centralized registry. Modules do not create their own i18next instances. | [0010](./0010-i18n-centralized-instance-registry.md) |
| ESM only. All packages use `"type": "module"` with only an `"import"` export condition. No `"require"` condition — CJS was never supported. | [0013](./0013-esm-only-output.md) |
| TanStack Query is the official data-fetching library. Global data queries use `usePublicDataQueries` and `useProtectedDataQueries`. | [0017](./0017-tanstack-query-for-data-fetching.md) |
| No built-in `useSession` or `sessionAccessor`. Applications define their own auth context. The framework handles 401 flow only, not auth mechanics. | [0019](./0019-removal-of-built-in-session-management.md) |
| `initializeFirefly` is the single entry point for creating a `FireflyRuntime` instance. No direct constructor calls. | [0020](./0020-initialize-firefly-single-entry-point.md) |
| Modules nest routes under other modules' layouts via `parentPath` or `parentId`. No global layout registry. | [0021](./0021-composable-nested-layouts.md) |
| Routes can be hoisted out of the root layout via `{ hoist: true }` to escape nested layout wrappers. | [0022](./0022-route-hoisting.md) |
| Public and protected routes render through separate outlet trees (`PublicRoutes` / `ProtectedRoutes`), each with independent data-fetching. | [0023](./0023-public-protected-dual-outlet.md) |
| All framework-owned properties on routes and navigation items use the `$` prefix (`$id`, `$visibility`, `$label`, `$name`). This prevents collision with future React Router properties. | [0024](./0024-dollar-prefix-convention.md) |
| No module-level singletons. All state lives on class instances owned by `FireflyRuntime`. Components subscribe via `useSyncExternalStore`. This enables multiple runtime instances (Storybook, testing). | [0025](./0025-singleton-removal-instance-based-architecture.md), [0028](./0028-use-sync-external-store.md) |
| Global data fetching is segmented into public and protected queries, fetched at different lifecycle stages. | [0026](./0026-public-protected-data-segmentation.md) |
