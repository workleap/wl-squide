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

# The AWF sandbox container (image 0.20.0) is missing basic coreutils (e.g. "tee")
# that the Claude Code CLI depends on, causing it to crash with "command not found".
#
# As a workaround, the sandbox is disabled for the agent so it runs directly on the host.
# "strict: false" is required because "sandbox.agent: false" is not allowed in strict mode.
#
# TODO: Re-enable the sandbox once the AWF container image ships with coreutils and
# a reliable way to make host-installed tools (pnpm) available inside the container.
strict: false
sandbox:
  agent: false

engine:
  id: claude
  version: latest
  max-turns: 100

steps:
  - name: Install pnpm
    uses: pnpm/action-setup@v4
    with:
      run_install: false

# The "tools" restrictions are only enforced when the sandbox is enabled.
# Kept here so they're ready when the sandbox is re-enabled.
tools:
  bash:
    - "pnpm:*"
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
3. Consider whether the pattern is intentional (e.g., `build-isolated` skipping `^build` for module federation, root tasks for root-level-only code, large `env` arrays being thorough).
4. Only include the finding if you are confident it is a genuine issue at severity Low or higher.

When in doubt, do NOT report the finding.

## Safe-output rules

You MUST call exactly ONE safe-output tool before finishing, UNLESS the audit finds zero reportable issues:

- Findings exist → call `mcp__safeoutputs__create_issue`
- No findings → end without calling any safe-output tool.

Do NOT call `mcp__safeoutputs__noop`.

---

## Step 0: Preflight check

```bash
pnpm --version
```

If this fails or `pnpm` is not found, STOP immediately and go to Step 4 (Failure).

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

| # | Severity | Category | Finding | File |
|---|----------|----------|---------|------|
| 1 | Medium | Configuration | Brief description | `turbo.json` |

### Details

#### 1. [Finding title]

**Severity:** Medium
**File:** `turbo.json:15`
**Issue:** Description of the problem.
**Recommendation:** How to fix it.

---
```

Then STOP. You are done.

## Step 4: Failure

If the preflight check failed, call `mcp__safeoutputs__create_issue` with:

- **title:** `monorepo audit failed — YYYY-MM-DD`
- **body:** Include the date and the failure reason.

Then STOP. You are done.
