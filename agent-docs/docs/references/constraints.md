# Architectural Constraints

> Quick-reference guardrails for agents. Each line is a hard constraint — violating it will break the framework or contradict a deliberate decision. Read the linked ADR only if you need the full rationale.

## Framework

| Constraint | ADR |
|---|---|
| Routes are frozen after Phase 1 bootstrap. Deferred functions can register/update navigation items only — never routes. | [0001](../../adr/0001-two-phase-registration.md) |
| Modules receive a scoped `RuntimeScope` proxy, not the raw runtime. Access to `moduleManager`, registration scopes, and internal stores is restricted. | [0002](../../adr/0002-centralized-firefly-runtime.md) |
| Modules communicate via the event bus or plugins. Direct imports between feature modules are forbidden. Internal lifecycle events use the `"squide-"` prefix. | [0003](../../adr/0003-event-bus-cross-module-communication.md) |
| Plugins are instantiated as factory functions `(runtime) => new Plugin(runtime)`. No post-construction `_setRuntime()`. | [0004](../../adr/0004-plugin-system-factory-functions.md) |
| Routes default to `$visibility: "protected"`. A route is public only when explicitly set to `$visibility: "public"`. This is a security decision. | [0005](../../adr/0005-protected-by-default-route-visibility.md) |
| All framework-owned properties on routes and navigation items use the `$` prefix (`$id`, `$visibility`, `$label`, `$name`). This prevents collision with future React Router properties. | [0024](../../adr/0024-dollar-prefix-convention.md) |
| No module-level singletons. All state lives on class instances owned by `FireflyRuntime`. Components subscribe via `useSyncExternalStore`. This enables multiple runtime instances (Storybook, testing). | [0025](../../adr/0025-singleton-removal-instance-based-architecture.md), [0028](../../adr/0028-use-sync-external-store.md) |
| Environment variables are registered via `EnvironmentVariablesPlugin` on `FireflyRuntime` — never read from `process.env`. This keeps Module Federation scenarios working. | [0008](../../adr/0008-environment-variables-on-runtime.md) |
| No built-in `useSession` or `sessionAccessor`. Applications define their own auth context. The framework handles 401 flow only, not auth mechanics. | [0019](../../adr/0019-removal-of-built-in-session-management.md) |
| Module Federation is encapsulated in `@squide/firefly-module-federation`. Core packages have zero federation knowledge. Local and remote modules use identical APIs. | [0007](../../adr/0007-module-federation-as-optional-plugin.md) |

## Build & Tooling

| Constraint | ADR |
|---|---|
| ESM only. All packages use `"type": "module"` with only an `"import"` export condition. No `"require"` condition — CJS was never supported. | [0013](../../adr/0013-esm-only-output.md) |
| JIT packages: dev `exports` point to raw `.ts` source; `publishConfig.exports` override to compiled `dist/` at publish time. | [0011](../../adr/0011-jit-packages-pattern.md) |
| All packages build with Rslib using shared config from `@workleap/rslib-configs`. No tsup. | [0012](../../adr/0012-rslib-for-library-builds.md) |
| Type checking uses `tsgo` (`@typescript/native-preview`), not `tsc`. | [0014](../../adr/0014-tsgo-for-type-checking.md) |

## CI & Infrastructure

| Constraint | ADR |
|---|---|
| Agent workflows use the lean YML + markdown prompt pattern. The `.yml` file handles infrastructure only; the `.md` prompt file is the source of truth for logic. | [0015](../../adr/0015-lean-yml-markdown-prompt-pattern.md) |
| Turborepo caching uses `actions/cache/restore` + `actions/cache/save` with SHA-based keys and 2-level cascade fallback. No Vercel remote cache. | [0016](../../adr/0016-github-actions-cache-for-turborepo.md) |
| PR builds use `--filter=...[$base_sha]` for incremental CI. Main-branch pushes run the full suite. `fetch-depth: 0` is required. | [0029](../../adr/0029-incremental-ci-turborepo-git-filters.md) |
