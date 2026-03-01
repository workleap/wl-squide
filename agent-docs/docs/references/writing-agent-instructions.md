# Writing Agent Instructions

> Principles for writing instructions that agents actually follow.
> Advisory language ("always consult", "consider whether") causes agents to skip rules and guess.
> Prohibition framing ("never guess", "never write code without loading skills") tests dramatically better.

## Principles

### 1. Prohibition framing over advisory framing

- **Bad:** "You should consult the routing table before starting work."
- **Good:** "Never start a task without first matching it to the routing table. Skipping this step produces code that contradicts repo conventions."

### 2. State consequences explicitly

- **Bad:** "Load skills before writing code."
- **Good:** "Never write code until skills are loaded — your general knowledge of these tools is wrong for this repo."

### 3. Concrete verification steps over vague diligence

- **Bad:** "Make sure the documentation is up to date."
- **Good:** "Run `git diff HEAD~1 --name-only` and update every agent-docs file touched by the changed paths. If the diff is empty, stop."

### 4. Negative examples adjacent to rules

- **Bad:** State the rule alone and trust agents to infer edge cases.
- **Good:** Pair each rule with a "Bad/Good" or "Do/Don't" example so the boundary is unambiguous.

### 5. Hard gates with specific triggers

- **Bad:** "Consider whether an ADR is needed."
- **Good:** "Before modifying any package's public API, adding a dependency, or changing how modules communicate, read the ADR index. Ignoring an existing ADR will produce code that contradicts deliberate architectural choices."

### 6. Single source of truth over duplicated content

- **Bad:** Repeat the same information in multiple documents.
- **Good:** Write it once, link everywhere else. Duplicated content drifts and agents will follow the stale copy.

### 7. Scope mandates to specific actions

- **Bad:** "Always follow best practices."
- **Good:** "Never rewrite sections that are already correct. Only change lines affected by actual code changes."

## Applying These Principles

When writing or editing any file in `agent-docs/` or `CLAUDE.md`:

1. Phrase every instruction as a prohibition or a concrete action — never as a suggestion.
2. Include a consequence or rationale in the same sentence.
3. If the rule has an edge case, add a negative example immediately after.

---
*See [CLAUDE.md](../../../CLAUDE.md) for navigation.*
