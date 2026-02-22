# ADR-0007: Module Federation as Optional Plugin

## Status

accepted

## Context

Squide supports loading modules from remote origins via Webpack/Rspack Module Federation. However, the framework's primary value is the modular architecture itself, not the deployment topology. Many applications use only local modules (sibling packages in a monorepo).

## Options Considered

1. **Module Federation as core architecture** — Build the framework around remote module loading. Common in micro-frontend tools.
2. **Hardcode both local and remote registries in core** — Support both but couple core to MF concepts.
3. **Module Federation as optional plugin** — Encapsulate MF in a separate package that plugs into the core `ModuleManager` via the plugin system.

## Decision

Option 3. Module Federation is encapsulated in `@squide/firefly-module-federation`. Its `ModuleFederationPlugin` constructor calls `runtime.moduleManager.addModuleRegistry(new RemoteModuleRegistry(...))` to register itself. The core framework has no knowledge of Module Federation.

Evidence: `packages/firefly-module-federation/src/ModuleFederationPlugin.ts`. The `ModuleRegistry` abstraction (`packages/core/src/registration/ModuleManager.ts`) accepts any registry type.

## Consequences

- Core remains focused on the modular architecture, not deployment topology.
- Applications that don't use Module Federation pay no cost.
- Any module loading strategy can be plugged in via the `ModuleRegistry` abstraction.
- Module Federation support requires an additional package dependency.
