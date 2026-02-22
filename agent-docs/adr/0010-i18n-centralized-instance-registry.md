# ADR-0010: i18n Via Centralized Instance Registry

## Status

accepted

## Context

In a modular application, each module may have its own translation resources and i18next configuration. Language changes must be synchronized across all modules for a consistent UI.

## Options Considered

1. **Single shared i18next instance** — Simpler but creates coupling between module namespaces and resource bundles.
2. **Fully independent instances** — Each module manages its own language. No synchronization, inconsistent UI during transitions.
3. **Centralized instance registry** — Each module creates its own i18next instance and registers it. Language changes are broadcast to all registered instances.

## Decision

Option 3. The `i18nextPlugin` maintains an `i18nextInstanceRegistry` (a `Map<string, i18n>` keyed by module name). When `changeLanguage()` is called, it iterates through all registered instances and calls `changeLanguage` on each.

Evidence: `packages/i18next/src/i18nextPlugin.ts` (lines 112-126). `packages/i18next/src/i18nextInstanceRegistry.ts`.

## Consequences

- Module autonomy preserved — each module owns its namespace, resources, and configuration.
- Language changes are consistent across all modules.
- Modules must register their instance with the plugin (small coordination cost).
