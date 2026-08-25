# Architecture Decision Records

ADRs capture the rationale behind significant architectural decisions — framework design, module APIs, and consumer-facing behavior. For operational decisions (build tooling, CI, agent workflows), see [odr/](../odr/).

## Before making architectural decisions

Read existing ADRs in this folder. If a prior decision covers your situation, follow it.
To reverse a prior decision, supersede the original ADR — do not silently ignore it.

## When to write a new ADR

Write an ADR when you are about to:

- Introduce a new pattern, layer, or abstraction in the framework
- Add or replace a significant dependency or module
- Make breaking changes to module interfaces or workspace wiring
- Change security, auth, or networking approaches
- Choose between multiple viable architectural approaches where the rationale isn't obvious

For build tooling, CI, or agent workflow decisions, write an [ODR](../odr/) instead.

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

When an ADR becomes `superseded` or `deprecated`, remove its row from [index.md](./index.md) and note the supersession on the superseding ADR's row. The index lists current decisions only — a struck-through or annotated row costs a reader a line to learn there is nothing to read. The ADR file itself is never deleted or rewritten; the record stays, and its Status section says what replaced it and why.

## Index

See [index.md](./index.md) for the full list of decisions.

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
