# ADR-0019: Removal of Built-in Session Management

## Status

accepted

## Context

Squide originally provided first-class session management APIs: `useSession`, `useIsAuthenticated`, and a `sessionAccessor` option on the `FireflyRuntime`. However, session management is inherently application-specific — each application has its own authentication flows, session shapes, token refresh strategies, and identity providers.

## Options Considered

1. **Keep built-in session management** — Continue providing `useSession` and `useIsAuthenticated`. Convenient but forces a specific session model.
2. **Offer a session interface** — Define a `SessionManager` interface that consumers implement. Framework manages the lifecycle, consumers define the shape.
3. **Remove session management entirely** — Let applications define their own React context for session state. The framework stays out of auth.

## Decision

Option 3. In Firefly v9.0, `useSession`, `useIsAuthenticated`, and `sessionAccessor` were all removed. Applications now define their own session management using React context (e.g., a `SessionManagerContext` backed by TanStack Query for server-state synchronization).

Evidence: `docs/updating/migrate-to-firefly-v9.0.md` instructs consumers to "define your own React context instead." The migration guide provides a `TanStackSessionManager` example.

## Consequences

- Applications have full control over session shape, storage, and refresh logic.
- No framework-imposed constraints on authentication strategy.
- Slightly more boilerplate per application (defining a context provider and consumer hooks).
- Session-related logic can leverage TanStack Query (ADR-0017) for server-state synchronization.
