# ODR-0010: CLAUDE.md Progressive Disclosure Design

## Status

proposed

## Context

CLAUDE.md auto-loads into every agent conversation, so every token in it is paid on every session — whether or not the agent needs that specific information. At the same time, CLAUDE.md is the only file agents see before they start reading `agent-docs/`, so it must contain enough signal for agents to find the right document on the first try.

An earlier version (~95 lines) had two navigation mechanisms: a routing table ("If You Are Working On…" with task→file#section mappings) and a table of contents (file→keyword-summary). Analysis showed the routing table duplicated ~80% of the ToC's routing signal at ~300–400 extra tokens.

## Options Considered

1. **Routing table + ToC** — Two structures, ~95 lines. Task-oriented framing and section-level anchors. High duplication; every document appears twice. Maintenance burden: new docs require updates in two places.
2. **Routing table only** — Task-oriented framing is natural for agents, but misses "miss-handling": tasks not anticipated by the table have no fallback. Noun-based keyword summaries handle unexpected queries better than verb-based task descriptions.
3. **Documentation Index only** — Single structure, ~50 lines. Each file listed once with keyword-rich content summaries. Inline section anchors only where they earn their token cost. No duplication.

## Decision

Option 3: Single Documentation Index with keyword-rich summaries and selective inline anchors.

### Structure rules

1. **One entry per file, never per section.** Each `agent-docs/` file appears exactly once in the index.
2. **Keyword summaries are the primary routing mechanism.** Each entry has a `— keyword1, keyword2, …` suffix covering the file's major topics. If a task fails to match any keyword, add the missing keyword to the relevant entry — never add a routing table row.
3. **Section anchors are the exception.** Add an inline anchor only when ALL conditions are met: (a) the target file is ~80+ lines, (b) the section is a distinct task that doesn't match the file-level keywords, (c) the section is a frequent agent task.
4. **No folder links on category headings.** Agents never `Read` a directory.
5. **Categories group entries but are not navigation targets.** They help agents skip irrelevant groups.

### Content rules

6. **Never add a routing table.** The Documentation Index already embeds task-routing signal in keyword summaries.
7. **Keep the file under ~55 lines.** Before adding a line, identify which existing line can be shortened or removed.
8. **Behavioral instructions stay in CLAUDE.md.** The "never guess" directive and the adr/index.md gate are prerequisites for the index to work — moving them to a separate file creates a bootstrapping paradox.
9. **No content enumeration that duplicates the index.** Do not describe what `agent-docs/` contains in prose — the index itself shows this.

### Why section anchors have limited value

The `Read` tool does not support URL fragments. When an agent follows `file.md#section`, it reads the entire file — the fragment is ignored. Anchors serve only as a cognitive hint ("this section exists") at ~15–20 tokens each. For files under ~80 lines (most of `agent-docs/`), the agent reads the whole file regardless, making anchors pure overhead.

## Consequences

- CLAUDE.md stays at ~50 lines (~550 tokens), roughly half the size of the routing-table version.
- Keyword summaries handle "miss" cases better than the routing table did, because noun-based summaries match wider queries than verb-based task descriptions.
- New documents added to `agent-docs/` require a single index entry (not two as before).
- If keyword coverage has a gap, the fix is adding a keyword — not adding structural complexity.
