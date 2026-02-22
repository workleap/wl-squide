# ADR-0004: Plugin System Via Factory Functions

## Status

accepted

## Context

Squide integrates with several external systems (MSW, LaunchDarkly, i18next, environment variables, Module Federation). These integrations need access to the runtime at construction time — for example, `ModuleFederationPlugin` calls `runtime.moduleManager.addModuleRegistry()` in its constructor, and `LaunchDarklyPlugin` registers error listeners using `runtime.logger` during construction.

Prior to Firefly v9.0, plugins received the runtime via a post-construction `_setRuntime()` method. This caused issues because some plugins required the runtime at instantiation time, creating a chicken-and-egg problem: the runtime needed plugins to be created first, but plugins needed the runtime to initialize.

## Options Considered

1. **Middleware pipeline** — Like Express or Redux middleware. Suited for request/response flows, not for registration-time setup.
2. **Formal DI container** — Inversify, tsyringe. Adds framework-level complexity unfamiliar in the React ecosystem.
3. **Hook-based extensions** — React hooks that compose behavior. Limited to rendering phase, cannot run at registration time.
4. **Plugin subclasses via factory functions** — Integrations extend `Plugin`, instantiated as `x => new MyPlugin(x)` where `x` is the runtime. The factory pattern resolves the chicken-and-egg problem: the runtime creates itself first, then passes itself to each factory.

## Decision

Option 4. Plugins are factory functions (`PluginFactory<TRuntime> = (runtime: TRuntime) => Plugin`) passed to `initializeFirefly`. The `Runtime` constructor iterates over factories: `this._plugins = plugins.map(x => x(this))`. Five built-in plugins follow this pattern: `EnvironmentVariablesPlugin` (always created), `MswPlugin` (conditional on `useMsw`), `LaunchDarklyPlugin` (conditional on `launchDarklyClient`), `i18nextPlugin` (user-provided), and `ModuleFederationPlugin` (from `@squide/firefly-module-federation`). Each plugin is retrieved at runtime via a memoized `getPlugin(name)` lookup.

Evidence: `packages/core/src/plugins/Plugin.ts` defines the minimal abstract class with `constructor(name, runtime)`. `packages/firefly/src/initializeFirefly.ts` (lines 167-184) wires built-in plugins. `docs/updating/migrate-to-firefly-v9.0.md` (lines 108-157) documents the `_setRuntime` → constructor migration and the `plugins: [new MyPlugin()]` → `plugins: [x => new MyPlugin(x)]` change.

## Consequences

- Plugins can deeply integrate with the runtime lifecycle from their constructor — no deferred initialization needed.
- The runtime doesn't need to know about any plugin's internals — it only knows the `Plugin` abstract class.
- Adding a new integration means creating a new `Plugin` subclass and a factory function — no changes to core.
- The `_setRuntime` post-construction pattern was eliminated, removing a class of initialization timing bugs.
