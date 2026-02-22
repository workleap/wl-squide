# ADR-0004: Plugin System Via Factory Functions

## Status

accepted

## Context

Squide integrates with several external systems (MSW, LaunchDarkly, i18next, environment variables, Module Federation). These integrations need access to the runtime at construction time and must self-register their capabilities.

## Options Considered

1. **Middleware pipeline** — Like Express or Redux middleware. Suited for request/response flows, not for registration-time setup.
2. **Formal DI container** — Inversify, tsyringe. Adds framework-level complexity.
3. **Hook-based extensions** — React hooks that compose behavior. Limited to rendering phase.
4. **Plugin subclasses via factory functions** — Integrations extend `Plugin`, instantiated as `x => new MyPlugin(x)` in the runtime constructor.

## Decision

Option 4. Plugins are factory functions passed to `initializeFirefly`. The runtime calls each factory with itself, giving plugins access to register services.

Evidence: `packages/core/src/plugins/Plugin.ts` defines a minimal abstract class. `packages/firefly/src/initializeFirefly.ts` creates plugins as `plugins.push(x => new MswPlugin(x))`, then `this._plugins = plugins.map(x => x(this))`. The `ModuleFederationPlugin` constructor calls `runtime.moduleManager.addModuleRegistry()` to inject a `RemoteModuleRegistry`.

## Consequences

- Plugins can deeply integrate with the runtime lifecycle from their constructor.
- The runtime doesn't need to know about any plugin's internals.
- Adding a new integration means creating a new Plugin subclass — no changes to core.
