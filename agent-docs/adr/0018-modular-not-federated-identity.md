# ADR-0018: "Modular" Not "Federated" Identity

## Status

accepted

## Context

Squide was originally conceived as "a shell for federated applications," built around Webpack Module Federation as the primary module loading mechanism. After the introduction of the local module feature, the team discovered that Squide provides significant value even for non-federated applications — structuring code as independent modules with their own routes, navigation, and lifecycle.

## Options Considered

1. **Stay "federated-first"** — Keep Module Federation as the core identity. Applications without federation are secondary citizens.
2. **Shift to "modular-first"** — Redefine Squide as a modular application shell. Module Federation becomes one optional deployment strategy among others.

## Decision

Option 2. Starting with Firefly v9.0, Squide's identity shifted to "a shell for modular applications." This was not just branding — it drove concrete architectural changes: Module Federation was progressively decoupled from core (culminating in ADR-0007 where it became a separate optional package in v16.0).

Evidence: `docs/updating/migrate-to-firefly-v9.0.md` states: "After playing with Squide's local module feature for a while, we discovered that Squide offers significant value even for non-federated applications, which triggered this shift in philosophy."

## Consequences

- Local modules (sibling packages in a monorepo) are the recommended default.
- Module Federation is optional — applications that don't need it carry no federation-related dependencies.
- Documentation, naming, and APIs de-emphasize federation terminology.
- The framework's value proposition is the modular architecture itself, not the deployment topology.
