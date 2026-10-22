# `update-third-parties` — design notes

> **Maintainers only.** This file is **not** loaded by the Claude Code skill loader — only `SKILL.md` is ingested when the skill is invoked. Keep operational instructions in `SKILL.md`; keep rationale here.

Adapted from `workleap/wl-app` (`.claude/skills/_update-third-parties`), minus its Intent UI target.

| Decision | Choice | Why |
|---|---|---|
| Orchestrator model | `model: sonnet` | The orchestration is mechanical — prompt, dispatch, aggregate — so opus is wasted, but it must compose leaf briefs and merge reports; haiku under-serves that. |
| Leaf model and effort in the table, mirrored in the delegates' frontmatter | Each `Agent` leaf is dispatched at the table's model and effort; the `_update-*` delegates carry the same values in their frontmatter | A skill's `model:` is ignored inside a leaf — the dispatch sets it — while its `effort:` overrides the dispatch's, so the two copies stay identical. Inline `Skill` invocation would switch the *conversation* model per delegate and leave it on the last one; delegation confines each skill to its leaf. The CI prompt (`.github/prompts/update-dependencies.md`) dispatches the same leaves for the same reason. |
| Decisions hoisted to one up-front prompt | The orchestrator asks targets + follow-ups once; leaves are briefed to never prompt | Leaves can't reach the user mid-run. The user answers once, then walks away. |
| Follow-ups run last, by a haiku runner leaf | reset + install, then lint + test, after the final target; skipped when deps changed nothing or failed | Validating after everything covers the combined result. A runner leaf quarantines the log bulk; haiku because it's a verbatim relay. |
| No `name:` frontmatter | The three skills are registered and invoked by folder name (`_update-*`) | A `name:` that differs from the folder makes the invocable name ambiguous; leaving it out keeps one name everywhere. |
| Sequential targets | deps -> skills, never parallel | `_update-skills` gates each skill on its package being on the latest minor, so it must see the bumped versions; both also contend on the pnpm store. |
