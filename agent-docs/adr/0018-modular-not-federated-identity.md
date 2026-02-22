# ADR-0018: "Modular" Not "Federated" Identity

## Status

accepted

## Context

Squide was originally conceived as "a shell for federated applications," built around Webpack Module Federation as the primary module loading mechanism. After the introduction of the local module feature, the team discovered that Squide provides significant value even for non-federated applications — structuring code as independent modules with their own routes, navigation, and lifecycle. `docs/updating/migrate-to-firefly-v9.0.md` states: "After playing with Squide's local module feature for a while, we discovered that Squide offers significant value even for non-federated applications."

## Options Considered

1. **Stay "federated-first"** — Keep Module Federation as the core identity. Applications without federation are secondary citizens.
2. **Shift to "modular-first"** — Redefine Squide as a modular application shell. Module Federation becomes one optional deployment strategy among others.

## Decision

Option 2. This was not just branding — it drove concrete architectural changes across a multi-release timeline:

- **v9.0** (philosophy shift declared): "With v9.0, Squide's philosophy has evolved. We used to describe Squide as a shell for **federated** applications. Now, we refer to Squide as a shell for **modular** applications." The `registerLocalModules` and `registerRemoteModules` functions continued to exist but were no longer the primary API.
- **v9.3** (API consolidation): Both `registerLocalModules` and `registerRemoteModules` were deprecated in favor of `bootstrap()`, unifying local and remote modules under a single registration path.
- **v12.0** (single entry point): `bootstrap` replaced by `initializeFirefly` (ADR-0020), which accepts `localModules` and `remoteDefinitions` as peer options — neither is privileged over the other.
- **v16.0** (physical extraction): Module Federation code was extracted from `@squide/firefly` into the separate `@squide/firefly-module-federation` package (ADR-0007). Import paths changed: `RemoteDefinition` moved from `@squide/firefly` to `@squide/firefly-module-federation`.

At the code level, `LocalModuleRegistry` and `RemoteModuleRegistry` both implement the same `ModuleRegistry` interface and share the same lifecycle (`registerModules` → `registerDeferredRegistrations` → `updateDeferredRegistrations`). Modules register routes and navigation items using identical APIs regardless of whether they are local or remote.

Evidence: `docs/updating/migrate-to-firefly-v9.0.md` (lines 23-24), `docs/updating/migrate-to-firefly-v9.3.md` (lines 14-20), `docs/updating/migrate-to-firefly-v12.0.md` (lines 22-27), `docs/updating/migrate-to-firefly-v16.0.md` (lines 10, 48-51). `docs/introduction/getting-started.md` consistently uses "modular" — the word "federated" does not appear in the current getting-started documentation.

## Consequences

- Local modules (sibling packages in a monorepo) are the recommended default.
- Module Federation is optional — applications that don't need it carry no federation-related dependencies.
- Documentation, naming, and APIs de-emphasize federation terminology — the current introduction describes Squide as "a React modular application shell."
- The framework's value proposition is the modular architecture itself, not the deployment topology.
- The multi-release timeline demonstrates progressive decoupling — each release moved further from "federated-first" toward "modular-first."
