# Architecture Decision Records

ADRs capture the rationale behind significant decisions made in this repository.

## Before making architectural decisions

Read existing ADRs in this folder. If a prior decision covers your situation, follow it.
To reverse a prior decision, supersede the original ADR — do not silently ignore it.

## When to write a new ADR

Write an ADR when you are about to:

- Introduce a new pattern, layer, or abstraction
- Add or replace a significant dependency or module
- Make breaking changes to module interfaces or workspace wiring
- Refactor core infrastructure components
- Change security, auth, or networking approaches
- Choose between multiple viable approaches where the rationale isn't obvious

## How to create an ADR

1. Find the next number: check this folder for the highest `NNNN` and increment.
2. Copy [template.md](./template.md) to `NNNN-short-title.md`.
3. Fill in all sections — especially **Options Considered** and **Decision** with clear rationale.
4. Set status to `proposed`. A developer will accept it during PR review.

## Status lifecycle

- **proposed** — written by agent, awaiting human review.
- **accepted** — approved by a developer.
- **superseded** — replaced by a newer ADR (link to the replacement).
- **deprecated** — no longer relevant.

## Index

### Framework Design

- [ADR-0001: Two-Phase Registration with Frozen Routes](./0001-two-phase-registration.md)
- [ADR-0002: Centralized FireflyRuntime Object](./0002-centralized-firefly-runtime.md)
- [ADR-0003: Event Bus for Cross-Module Communication](./0003-event-bus-cross-module-communication.md)
- [ADR-0004: Plugin System Via Factory Functions](./0004-plugin-system-factory-functions.md)
- [ADR-0005: Protected-by-Default Route Visibility](./0005-protected-by-default-route-visibility.md)
- [ADR-0006: Pending Registration Queue](./0006-pending-registration-queue.md)
- [ADR-0007: Module Federation as Optional Plugin](./0007-module-federation-as-optional-plugin.md)
- [ADR-0008: Environment Variables on Runtime](./0008-environment-variables-on-runtime.md)
- [ADR-0009: Bootstrapping State Machine](./0009-bootstrapping-state-machine.md)
- [ADR-0010: i18n Via Centralized Instance Registry](./0010-i18n-centralized-instance-registry.md)

### Build & Tooling

- [ADR-0011: JIT Packages Pattern](./0011-jit-packages-pattern.md)
- [ADR-0012: Rslib for Library Builds](./0012-rslib-for-library-builds.md)
- [ADR-0013: ESM-Only Output](./0013-esm-only-output.md)
- [ADR-0014: tsgo for Type Checking](./0014-tsgo-for-type-checking.md)

### API & Integration

- [ADR-0017: TanStack Query as Official Data-Fetching Library](./0017-tanstack-query-for-data-fetching.md)
- [ADR-0018: "Modular" Not "Federated" Identity](./0018-modular-not-federated-identity.md)
- [ADR-0019: Removal of Built-in Session Management](./0019-removal-of-built-in-session-management.md)
- [ADR-0020: `initializeFirefly` as Single Entry Point](./0020-initialize-firefly-single-entry-point.md)

### Infrastructure & CI

- [ADR-0015: Lean YML + Markdown Prompt Pattern](./0015-lean-yml-markdown-prompt-pattern.md)
- [ADR-0016: GitHub Actions Cache for Turborepo](./0016-github-actions-cache-for-turborepo.md)

---
*See [AGENTS.md](../../AGENTS.md) for navigation.*
