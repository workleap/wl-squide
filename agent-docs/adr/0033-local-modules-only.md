# ADR-0033: Local Modules Only

## Status

proposed

Supersedes [ADR-0007](./0007-module-federation-as-optional-plugin.md).

## Context

[ADR-0007](./0007-module-federation-as-optional-plugin.md) kept Module Federation as an optional plugin, in `@squide/firefly-module-federation`, with its build configuration in `@squide/firefly-rsbuild-configs` and `@squide/firefly-webpack-configs`. Since then, local modules became the only recommended and documented way to build a Squide application: the webpack sample, the remote module template and the Module Federation guides were removed, and every sample was converted to local modules.

From that point, no application in the repository built a federated bundle. The two remaining packages were guarded by unit and snapshot tests only, `@module-federation/*` was on a permanent version hold, and the packages still had to follow every `@squide/firefly` release.

## Options Considered

1. **Keep the packages in maintenance mode** — Still published, no new features. Keeps an install path for federated applications, but the packages cannot be validated end to end and still cost a release on every change of `@squide/firefly`.
2. **Remove the packages and the extension points they used** — Also delete the `ModuleRegistry` abstraction, `ModuleManager.addModuleRegistry()`, the `moduleDefinitions` option of `initializeFirefly` and the tracing exports of `@squide/firefly/internal`. Breaks the versions of `@squide/firefly-module-federation` already installed by consumers, which depend on `@squide/firefly` `^20` and import those members.
3. **Remove the packages, keep the extension points** — Delete the packages and their documentation, leave `@squide/core` and `@squide/firefly` unchanged.

## Decision

Option 3. Squide supports local modules only. `@squide/firefly-module-federation` and `@squide/firefly-rsbuild-configs` are deleted from the repository, with their reference documentation and migration guides, and are deprecated on npm. Module Federation, remote modules and bundler configuration packages must not be reintroduced.

The following members no longer have a consumer in the repository and are kept on purpose:

- The `ModuleRegistry` abstract class and `ModuleManager.addModuleRegistry()` in `@squide/core`.
- The `moduleDefinitions` option of `initializeFirefly` in `@squide/firefly`.
- The Honeycomb tracing exports of `@squide/firefly/internal`.

The last published version of `@squide/firefly-module-federation` (`4.0.1`) declares `@squide/firefly` `^20` as a dependency and imports these members, so removing them in a `20.x` release would break applications that have not migrated yet. They can be removed in a major version of `@squide/firefly` and `@squide/core`.

Evidence: `packages/core/src/registration/ModuleRegistry.ts` and `packages/core/src/registration/ModuleManager.ts` define the abstraction. `packages/firefly/src/initializeFirefly.ts` accepts `moduleDefinitions`. `packages/firefly/src/internal.ts` exports the tracing members.

## Consequences

- Every package is a JIT package and no `@module-federation/*` dependency remains, so there is no held dependency for it anymore.
- Applications that still use remote modules stay on `@squide/firefly` `20.x` with the last published versions of the removed packages until they move to local modules.
- The historical migration guides in `docs/updating/` still describe remote modules, as they document past versions.
- A few members of `@squide/core` and `@squide/firefly` have no consumer in the repository until the next major version.
