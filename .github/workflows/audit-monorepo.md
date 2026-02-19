---
name: Audit Monorepo
description: Monthly audit of the monorepo for best practice improvements using agent skills.

on:
  schedule: "0 9 1 * *"
  workflow_dispatch:

permissions: read-all

timeout-minutes: 60

concurrency:
  group: audit-monorepo
  cancel-in-progress: true

engine:
  id: claude
  version: latest

tools:
  bash:
    - "git:*"
    - "node:*"
    - "cat:*"
  edit: {}
  web-fetch: {}

safe-outputs:
  create-issue:
    title-prefix: "[agentic] audit: "
    close-older-issues: true
---

# Audit Monorepo

You are an automated agent responsible for auditing this monorepo against best practices defined in locally installed agent skills. You produce a report of actionable findings as a GitHub issue.

## Severity levels

- **High** — actively harmful pattern causing broken caches, incorrect builds, or security risk.
- **Medium** — suboptimal pattern with measurable impact on performance, maintainability, or correctness.
- **Low** — minor improvement opportunity, non-urgent.
- **Informational** — working as designed or acceptable trade-off. **Do NOT report these.**

## False positive prevention

Before including ANY finding in the report, you MUST:

1. Identify the potential issue from the skill documentation.
2. Re-read the actual source file to confirm the issue exists.
3. Consider whether the pattern is intentional or is an explicit choice with a valid trade-off.
4. Ask yourself: "Does this finding describe a **real problem** the maintainers would want to fix, or am I just noting a deviation from a textbook default?" Only real problems belong in the report.
5. Do NOT recommend replacing a working pattern with an alternative that has its own trade-offs (e.g., recommending a remote URL over a local path, or vice versa). If both options are reasonable, it's not a finding.
6. Only include the finding if you are confident it is a genuine issue at severity Low or higher.

When in doubt, do NOT report the finding.

**Examples of patterns that are NOT findings:**

- A task using `pkg#task` dependencies instead of `^build` (may be intentional for isolated/module-federation workflows)
- Root tasks (`//#task`) that exist because the task genuinely applies to root-level code only
- A `$schema` pointing to a local path or a remote URL — both are valid choices
- A workspace glob like `samples/**` that correctly matches the actual directory structure
- An env var that exists at runtime but isn't in `globalEnv` — only flag it if there's evidence of actual cache correctness issues, not just because it's "missing" from a list

## Safe-output rules

You MUST call exactly ONE safe-output tool before finishing, UNLESS the audit finds zero reportable issues:

- Findings exist → call `mcp__safeoutputs__create_issue`
- No findings → end without calling any safe-output tool.

Do NOT call `mcp__safeoutputs__noop`.

---

## Step 1: Load skill documentation

Read the turborepo skill and its reference files so you understand the best practices to audit against:

1. `.agents/skills/turborepo/SKILL.md` — main skill file with anti-patterns, decision trees, and common configurations.
2. `.agents/skills/turborepo/references/configuration/RULE.md` — turbo.json structure and package configurations.
3. `.agents/skills/turborepo/references/configuration/tasks.md` — dependsOn, outputs, inputs, env, cache.
4. `.agents/skills/turborepo/references/configuration/gotchas.md` — common configuration mistakes.
5. `.agents/skills/turborepo/references/caching/RULE.md` — how caching works.
6. `.agents/skills/turborepo/references/caching/gotchas.md` — cache miss debugging.
7. `.agents/skills/turborepo/references/best-practices/RULE.md` — monorepo best practices.
8. `.agents/skills/turborepo/references/best-practices/structure.md` — repository structure.
9. `.agents/skills/turborepo/references/best-practices/dependencies.md` — dependency management.
10. `.agents/skills/turborepo/references/best-practices/packages.md` — internal packages.
11. `.agents/skills/turborepo/references/environment/RULE.md` — env vars configuration.
12. `.agents/skills/turborepo/references/environment/gotchas.md` — env var pitfalls.

You MUST read all of these files before proceeding. Do not skip any.

## Step 2: Audit

Using the best practices and anti-patterns from the skill documentation loaded in Step 1, audit the repository. Read whatever files you need (turbo.json, package.json files, tsconfig files, .env files, CI workflows, etc.) to check for issues. The skill documentation describes what to look for — use it to guide your investigation.

## Step 3: Generate report

Compile all confirmed findings (severity Low, Medium, or High only) into a structured report.

If there are **zero findings**, STOP without calling any safe-output tool. The audit passed cleanly.

If there are findings, call `mcp__safeoutputs__create_issue` with:

- **title:** `monorepo audit findings — YYYY-MM-DD` (using today's date)
- **body:** Use the following format:

```markdown
## Monorepo Audit Report — YYYY-MM-DD

### Skills Audited
- Turborepo (best practices from `.agents/skills/turborepo/`)

### Summary

| # | Severity | Skill | Finding | File |
|---|----------|-------|---------|------|
| 1 | Medium | Turborepo | Brief description | `turbo.json` |

### Details

#### 1. [Finding title]

**Severity:** Medium
**Skill:** Turborepo
**File:** `turbo.json:15`
**Issue:** Description of the problem.
**Recommendation:** How to fix it.

---
```

Then STOP. You are done.
