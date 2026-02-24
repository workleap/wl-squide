# ADR-0030: Skill Body / Reference Split for workleap-squide

## Status

proposed

## Context

The `workleap-squide` agent skill had ~405 lines in its SKILL.md body (~1,845 tokens). Approximately 70% of that content was duplicated in the `references/` folder (runtime-api.md, hooks-api.md, components.md, patterns.md, integrations.md). Because the SKILL.md body is always loaded into context when the skill is triggered, this duplication inflated every agent conversation — even when the agent only needed a subset of the information.

The skill-creator spec mandates that all "when to use" trigger categories MUST remain in the YAML `description` field (not moved to the body), so compression of the description required rewriting rather than moving.

## Options Considered

1. **Keep everything in SKILL.md body** — Accept the bloat. Simple but wasteful; every conversation pays the token cost even when most content is already in references.
2. **Move all code to references, leave only prose in body** — Minimal body but loses the most-reached-for patterns (host setup, navigation rendering) that agents need in nearly every conversation.
3. **Keep critical patterns in body, delegate the rest to references** — Body retains the 4 most complex/pitfall-prone patterns; everything else is accessed on-demand via reference files. A "Reference Guide" section tells agents exactly which file to read for each topic.

## Decision

Option 3. The SKILL.md body keeps these sections because they represent complex multi-file wiring or non-obvious API signatures that agents reach for most often:

- **Host Application Setup** (~74 lines) — 3-file wiring (index.tsx, App.tsx, register.tsx) that is the starting point for nearly every question.
- **Navigation Rendering** (~38 lines) — `RenderItemFunction` / `RenderSectionFunction` signatures are a critical pitfall; agents frequently get them wrong without an inline example.
- **Global Data Fetching** (~34 lines) — The `isUnauthorizedError` second parameter of `useProtectedDataQueries` is non-obvious.
- **Deferred Navigation Items** (~25 lines) — Two-phase registration with `deferredRuntime` vs `runtime` is a unique concept.

Everything else was removed from the body and is already covered in references:

| Removed section | Reference file |
|----------------|----------------|
| Local Module Setup | `references/patterns.md` |
| MSW Request Handlers | `references/integrations.md` |
| Event Bus | `references/hooks-api.md` |
| Environment Variables | `references/hooks-api.md` |
| Feature Flags | `references/integrations.md` |
| Logging | `references/hooks-api.md` |
| Error Boundaries | `references/patterns.md` |
| API Quick Reference (all subsections) | `references/runtime-api.md`, `references/hooks-api.md`, `references/components.md`, `references/integrations.md` |

The YAML description was compressed from ~872 to ~640 characters by:
- Replacing 8-hook enumeration with category-based phrasing ("event bus, environment variables, feature flags, logging, bootstrapping state")
- Qualifying integration keywords with "Squide" to reduce false positives from sibling skills
- Merging the "error boundaries" and "modular architecture" items
- Adding `@squide/firefly` package name and `FireflyProvider` as trigger signals

A new "Reference Guide" section (~12 lines) was added to the body with explicit pointers to each reference file and descriptions of when to read them.

## Consequences

- **Body reduced from ~405 to ~237 lines (~47%)**, saving ~845 tokens per conversation.
- **Description reduced by ~27%** while retaining all 8 trigger categories.
- **No coverage regressions.** All 21 validation questions remain answerable from SKILL.md + references combined. The 4 questions that cannot be fully answered (Q1: motivation, Q2: getting-started guide, Q4: modular architecture definition, Q20: plugin authoring) were pre-existing gaps — never covered in the original SKILL.md either.
- **Agents updating the skill must preserve this split.** New content belongs in the appropriate reference file unless it is a critical pattern that agents need in nearly every conversation. The body should not grow back past ~250 lines.
- **The Reference Guide section is load-bearing.** It tells agents which reference file to read for each topic. If a new reference file is added, its pointer must be added here.
