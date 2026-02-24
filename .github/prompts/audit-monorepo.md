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
3. Check for comments, ADRs, or consistent repo-wide patterns that explain the choice. If you find evidence it is intentional, do NOT report it.
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

---

## Step 1: Load skill documentation

Read all files in `.agents/skills/turborepo/`, `.agents/skills/pnpm/`, and `.agents/skills/workleap-react-best-practices/` (including all subdirectories) so you understand the best practices to audit against. Do not skip any file.

## Step 2: Audit

Using the best practices and anti-patterns from the skill documentation loaded in Step 1, audit the repository. Read whatever files you need (turbo.json, package.json files, pnpm-workspace.yaml, .npmrc, pnpm-lock.yaml, tsconfig files, .env files, CI workflows, etc.) to check for issues. The skill documentation describes what to look for — use it to guide your investigation.

## Step 3: Validate findings with a subagent

Before generating the report, validate your findings using a subagent to eliminate false positives. Launch a subagent with the Task tool using the **opus** model and provide it with:

1. The full list of candidate findings (severity, skill, file, description, and recommendation for each).
2. Instructions to independently re-read each referenced file and verify whether the issue actually exists.
3. Instructions to check whether each flagged pattern might be intentional (e.g., comments explaining the choice, consistency with the rest of the codebase, or a valid trade-off).
4. Instructions to return a verdict for each finding: **confirmed** or **rejected** with a brief justification.

Only carry forward findings that the subagent confirms. Drop any finding that the subagent rejects.

## Step 4: Generate report

Compile all confirmed findings (severity Low, Medium, or High only) into a structured report.

If there are **zero findings**, STOP. The audit passed cleanly. You are done.

If there are findings, create a GitHub issue:

```bash
gh issue create \
  --title "audit: monorepo audit findings — $(date -u +%Y-%m-%d)" \
  --body "$(cat <<'EOF'
## Monorepo Audit Report — YYYY-MM-DD

### Skills Audited
- Turborepo (best practices from `.agents/skills/turborepo/`)
- pnpm (best practices from `.agents/skills/pnpm/`)
- Workleap React Best Practices (best practices from `.agents/skills/workleap-react-best-practices/`)

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
EOF
)"
```

Replace the placeholder content above with the actual findings. Then STOP. You are done.
