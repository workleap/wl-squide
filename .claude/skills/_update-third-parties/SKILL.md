---
name: update-third-parties
description: Update the repo's third-party sources — npm dependencies and agent skills — together or either one. Use as "/update-third-parties". Prompts up front for which targets to update, then delegates to the `_update-dependencies` and `_update-skills` skills.
disable-model-invocation: true
model: sonnet
effort: medium
---

# Update third parties

Run any subset of the repo's two third-party updates, one `Agent` leaf per target. Run from the repo root.

## Delegation model

You prompt, dispatch, and report; leaves update. Each target leaf runs its skill, dispatched at the table's model and effort; never invoke the `Skill` tool yourself.

| Target | Leaf runs | Model | Effort | Refreshes |
|---|---|---|---|---|
| npm dependencies | `_update-dependencies` | sonnet | medium | outdated workspace packages + peer ranges + lockfile |
| Agent skills | `_update-skills` | sonnet | medium | installed (`pnpx skills add`) skills in `.agents/skills/` |
| Follow-ups (step 3) | the opted-in commands | haiku | — | nothing — returns pass/fail + failures verbatim |

## 1. Ask once, up front

A single prompt carrying both multi-select questions — one interaction, never a second round — nothing pre-selected:

- **Targets** — the two above. None chosen -> stop.
- **After the updates** — reset + install (`pnpm reset` + `pnpm install`; applies only when npm dependencies is selected) / lint + test (`pnpm lint` + `pnpm test`).

Every decision the leaves would ask is settled here. Leaves never prompt.

## 2. Run the selected targets

One leaf per selected target — the first two table rows only; the follow-ups row runs in step 3. Sequential, in table order — deps before skills so the skill gate sees the bumped packages. Brief each leaf (the bullets are the leaf's instructions, not yours):

- Invoke your target's skill — its `Leaf runs` name from the table — via the `Skill` tool; never read-and-inline its SKILL.md. End your final message with the skill's report.
- Never prompt; a stop per the skill's own rules -> report it.
- Deps leaf: skip the skill's step-1 prompt entirely and proceed as if neither follow-up was selected — the orchestrator runs follow-ups in its step 3.

A blocked target never aborts the other — record, move on.

## 3. Follow-ups

After the last target, dispatch the runner with what was checked: reset + install first (skip when npm dependencies wasn't selected, or when the deps leaf reported nothing changed or a failed update), then lint + test (skip when no target changed anything).

## Report

One combined summary: a one-line result per selected target (from its leaf's report) and the follow-up results. Note unselected and blocked targets.
