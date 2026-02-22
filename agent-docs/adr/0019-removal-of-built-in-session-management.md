# ADR-0019: Removal of Built-in Session Management

## Status

accepted

## Context

Squide originally provided first-class session management APIs: `useSession`, `useIsAuthenticated`, and a `sessionAccessor` option on the `FireflyRuntime`. However, session management is inherently application-specific — each application has its own authentication flows, session shapes, token refresh strategies, and identity providers. Abstracting all of these behind a generic framework API created friction rather than reducing it.

## Options Considered

1. **Keep built-in session management** — Continue providing `useSession` and `useIsAuthenticated`. Convenient but forces a specific session model.
2. **Offer a session interface** — Define a `SessionManager` interface that consumers implement. Framework manages the lifecycle, consumers define the shape.
3. **Remove session management entirely** — Let applications define their own React context for session state. The framework stays out of auth.

## Decision

Option 3. In Firefly v9.0, `useSession`, `useIsAuthenticated`, and `sessionAccessor` were all removed. Applications now define their own session management using React context.

The framework provides a well-established recipe (`docs/recipes/add-authentication.md`) instead of built-in primitives. The recipe demonstrates: defining a `SessionManager` interface and `SessionManagerContext`, implementing a `TanstackQuerySessionManager` class that uses `useQueryClient` for cache invalidation on `clearSession()`, and creating a `BootstrappingRoute` component that fetches session via `useProtectedDataQueries` (ADR-0017).

The 401 handling mechanism was redesigned to be framework-agnostic: `useProtectedDataQueries` accepts an `isUnauthorizedError` callback from the consumer (e.g., `error => isApiError(error) && error.status === 401`). When a 401 is detected, the state machine (ADR-0009) dispatches `"is-unauthorized"`, which bypasses bootstrapping to allow rendering a login page even though protected data was never fetched. This means the framework handles the auth *flow* (redirect to login on 401) without understanding auth *mechanics* (token format, session shape, refresh strategy).

The `@squide/fakes` package provides `LocalStorageSessionManager` — a development-only utility for MSW-based development, NOT a replacement for production session management. The recipe explicitly warns: "Our security department reminds you to refrain from using a fake LocalStorageSessionManager in a production application."

Evidence: `docs/updating/migrate-to-firefly-v9.0.md` (lines 36-38) lists the removed APIs with "define your own React context instead." `docs/recipes/add-authentication.md` provides the full replacement pattern (lines 163-373). `packages/firefly/src/useProtectedDataQueries.ts` (lines 83-98) implements the 401 detection. `packages/fakes/src/LocalStorageSessionManager.ts` provides the development-only fake.

## Consequences

- Applications have full control over session shape, storage, and refresh logic.
- No framework-imposed constraints on authentication strategy.
- The 401 handling is delegated to consumer code via a callback — the framework redirects to login without understanding what a "session" is.
- Slightly more boilerplate per application (defining a context provider and consumer hooks), offset by the recipe providing copy-paste-ready code.
- Session-related logic can leverage TanStack Query (ADR-0017) for server-state synchronization, which was not possible with the old built-in approach.
- `@squide/fakes` provides development utilities without polluting the production framework API.
