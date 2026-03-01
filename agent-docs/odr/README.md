# Operational Decision Records

ODRs capture the rationale behind significant operational decisions — build tooling, CI infrastructure, agent workflows, and development process conventions. They use the same template as ADRs but cover decisions that do not affect the framework's architecture, APIs, or consumer-facing behavior.

For framework architecture decisions, see [adr/](../adr/).

## Before making operational decisions

Read existing ODRs in this folder. If a prior decision covers your situation, follow it.
To reverse a prior decision, supersede the original ODR — do not silently ignore it.

## When to write a new ODR

Write an ODR when you are about to:

- Change build tooling, test runners, or type-checking tools
- Modify CI pipeline structure, caching strategies, or workflow patterns
- Introduce or change agent workflow conventions (skills, prompts, documentation standards)
- Choose between multiple viable operational approaches where the rationale isn't obvious

## How to create an ODR

1. Find the next number: check both this folder and `adr/` for the highest `NNNN` and increment. The numbering sequence is shared.
2. Copy [template.md](./template.md) to `NNNN-short-title.md`.
3. Fill in all sections — especially **Options Considered** and **Decision** with clear rationale.
4. Set status to `proposed`. A developer will accept it during PR review.

## Status lifecycle

- **proposed** — written by agent, awaiting human review.
- **accepted** — approved by a developer.
- **superseded** — replaced by a newer ODR (link to the replacement).
- **deprecated** — no longer relevant.

## Index

See [index.md](./index.md) for the full list of decisions.

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
