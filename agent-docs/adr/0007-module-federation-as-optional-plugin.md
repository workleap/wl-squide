# ADR-0007: Module Federation as Optional Plugin

## Status

accepted

## Context

Squide supports loading modules from remote origins via Webpack/Rspack Module Federation. However, the framework's primary value is the modular architecture itself, not the deployment topology (ADR-0018). Many applications use only local modules (sibling packages in a monorepo).

Module Federation support evolved through three package stages:
1. `@squide/webpack-module-federation` — Original package, tightly coupled to Webpack.
2. `@squide/module-federation` — Intermediate rename when Rspack support was added alongside Webpack.
3. `@squide/firefly-module-federation` — Final name (v16.0), reflecting the plugin system (ADR-0004) and the "Firefly" branding. This extraction commit (`de6b3335f`) moved all MF-specific code out of `@squide/firefly`.

## Options Considered

1. **Module Federation as core architecture** — Build the framework around remote module loading. Common in micro-frontend tools.
2. **Hardcode both local and remote registries in core** — Support both but couple core to MF concepts.
3. **Module Federation as optional plugin** — Encapsulate MF in a separate package that plugs into the core `ModuleManager` via the plugin system (ADR-0004).

## Decision

Option 3. Module Federation is encapsulated in `@squide/firefly-module-federation`. Its `ModuleFederationPlugin` constructor calls `runtime.moduleManager.addModuleRegistry(new RemoteModuleRegistry(...))` to register itself as a factory function (ADR-0004). The core framework has no knowledge of Module Federation — it only knows the `ModuleRegistry` abstraction, which defines a `registerModules()` method that any registry can implement.

For applications using Module Federation, `initializeFirefly` (ADR-0020) accepts a `remoteDefinitions` option that is forwarded to the `ModuleFederationPlugin`. The plugin resolves remote entry files, fetches module metadata, and registers each remote module through the same `ModuleManager` that handles local modules. This means consumer code uses identical APIs for local and remote modules — `registerRoute()`, `registerNavigationItem()`, deferred registrations — regardless of where the module is loaded from.

The migration to Module Federation 2.0 (Enhanced API) was also handled within this package, transparent to consumers. `docs/updating/migrate-to-firefly-v9.0.md` states: "After playing with Squide's local module feature for a while, we discovered that Squide offers significant value even for non-federated applications."

Evidence: `packages/firefly-module-federation/src/ModuleFederationPlugin.ts` extends `Plugin` and creates a `RemoteModuleRegistry`. `packages/core/src/registration/ModuleManager.ts` defines the `ModuleRegistry` abstraction with `addModuleRegistry()`. `docs/updating/migrate-to-firefly-v9.0.md` documents the philosophy shift from "federated" to "modular."

## Consequences

- Core remains focused on the modular architecture, not deployment topology.
- Applications that don't use Module Federation pay no cost — no federation-related code in `@squide/firefly` or `@squide/core`.
- Any module loading strategy can be plugged in via the `ModuleRegistry` abstraction — the framework is not limited to Module Federation.
- Module Federation support requires an additional package dependency (`@squide/firefly-module-federation`).
- The three-stage package evolution demonstrates the progressive decoupling — each rename reflected a deeper separation of concerns.
