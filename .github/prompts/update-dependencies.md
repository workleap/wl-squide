# Update Dependencies

You are an automated agent responsible for updating the dependencies and agent skills of this monorepo and validating that everything still works correctly.

The updates themselves are done by the repo's `_update-dependencies` and `_update-skills` skills (in `.claude/skills/`). Run each one in a subagent dispatched with the Agent tool — never invoke them in this session, because a skill's `model:` frontmatter would switch this session's model. Brief each subagent with:

- Invoke the skill via the Skill tool. If the Skill tool can't find it, read the skill's `SKILL.md` and follow it.
- This is an unattended CI run: never prompt. A stop per the skill's own rules -> report it.
- End your final message with the skill's report, including any failed command's full output verbatim.

## Constraints

- You have a maximum of **10 attempts** to pass all validation steps. If you exhaust all attempts, go to Step 5 (Failure).
- You MUST execute every validation step (2a, 2b, 2c, 2d) in order. Do NOT skip any step — the only exception is Step 1 finding no dependency updates.
- Do NOT create new source files as part of a dependency update. Only modify existing files when migrating to a newer API.
- Do NOT read `CLAUDE.md` or `agent-docs/`.
- **Avoid rabbit holes**: If you spend more than 3 attempts or 10 tool calls investigating a single issue without progress, stop. Revert the problematic package to its previous version, open an issue, and move on.

---

## Step 1: Update dependencies

Dispatch a subagent for the `_update-dependencies` skill. Add to its brief: skip the skill's step-1 prompt and proceed as if neither follow-up was selected.

**Check the report.** If any command in it failed (`pnpm update-outdated-deps` or `pnpm install`), create an issue reporting the failure and stop:

```bash
gh issue create \
  --title "[agent] Dependency update command failed" \
  --body "## Dependency update command failed

A dependency update command failed before any validation could begin.

## Error

<Paste the full stderr/stdout from the failed command, as reported by the subagent>

## Workflow run

$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
```

Then STOP. You are done.

If the update succeeded, check if any `package.json` files were modified:

```bash
git diff --name-only -- '**/package.json' ':!node_modules'
```

If the output is empty, there are no dependency updates. Discard any lockfile churn so only skill updates can reach the PR, then skip Step 2 and go to Step 3:

```bash
git checkout -- pnpm-lock.yaml
```

## Step 2: Validation loop

Run steps 2a through 2d in order. If ANY step fails, diagnose and fix the issue before retrying. Read error messages carefully, inspect failing source code, look up changelogs or migration guides for packages with breaking changes, then apply the fix and restart from Step 2a.

**When fixing breaking changes:**

- Migrate code to use the newer API or pattern introduced by the updated package.
- Do NOT add polyfills, shims, or workarounds for features already available in the runtime.
- Do NOT patch or monkey-patch libraries to suppress errors.
- If a breaking change cannot be resolved by a clean migration, revert that specific package to its previous version, open an issue using the template below, then continue with the remaining updates.

```bash
gh issue create \
  --title "[agent] Failed to update <package-name>" \
  --body "## Failed dependency update

**Package**: \`<package-name>\`
**From**: \`<old-version>\` → **To**: \`<new-version>\`

## Error

<Error messages and which validation step failed>

## What was tried

<Brief description of migration attempts>

## Workflow run

$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
```

### Step 2a: Linting

```bash
pnpm lint
```

All checks must pass with zero errors.

### Step 2b: Tests

```bash
pnpm test
```

All tests must pass. If a test fails, run the failing package's tests directly (e.g., `pnpm --filter <package> test`) to get clearer output instead of re-running the full suite.

### Step 2c: Validate the "endpoints" sample app

Use `agent-browser` for all browser interactions in this step. It is installed as a workspace devDependency. Read the locally installed agent skill at `.agents/skills/agent-browser/` to learn the available commands. Do NOT use `agent-browser screenshot` — use only `snapshot` (text) and `console` (errors). Screenshots are binary and cannot be analyzed. Running a build is NOT sufficient — you must start the dev server and validate in a real browser.

1. Start the server in the background using the shell `&` operator (do NOT use `run_in_background: true`): `pnpm serve-endpoints > /tmp/endpoints-serve.log 2>&1 &`
2. The endpoints app listens on port **8080** (host) and **8081** (remote module). Wait for both to be ready — do NOT use `sleep`, do NOT write polling loops, do NOT parse the log file for a URL. Instead, immediately run: `curl --retry 30 --retry-delay 5 --retry-connrefused --silent --output /dev/null http://localhost:8080 && curl --retry 30 --retry-delay 5 --retry-connrefused --silent --output /dev/null http://localhost:8081`. If the curl command fails, run `cat /tmp/endpoints-serve.log` for diagnostics.
3. The app has a mock login page. Use username `temp` and password `temp` to authenticate.
4. Navigate to the following pages and check that each renders without errors:
   - `/` (Home page)
   - `/subscription`
   - `/federated-tabs`
   - `/federated-tabs/episodes`
   - `/federated-tabs/locations`
5. For each page, use `agent-browser snapshot` to verify the page rendered content, and use `agent-browser console` to check for console errors (ignore warnings and known noise like network errors from fake APIs or MSW)
6. Stop the dev server process when done: `kill $(lsof -t -i:8080) 2>/dev/null || true; fuser -k 8080/tcp 2>/dev/null || true`

### Step 2d: Validate the "storybook" sample app

Use `agent-browser` for all browser interactions in this step. It is installed as a workspace devDependency. Read the locally installed agent skill at `.agents/skills/agent-browser/` to learn the available commands. Do NOT use `agent-browser screenshot` — use only `snapshot` (text) and `console` (errors). Screenshots are binary and cannot be analyzed. Running a build is NOT sufficient — you must start the dev server and validate in a real browser.

1. Start the dev server in the background using the shell `&` operator (do NOT use `run_in_background: true`): `pnpm dev-storybook > /tmp/storybook-dev.log 2>&1 &`
2. The storybook app listens on port **6006**. Wait for it to be ready — do NOT use `sleep`, do NOT write polling loops, do NOT parse the log file for a URL. Instead, immediately run: `curl --retry 30 --retry-delay 5 --retry-connrefused --silent --output /dev/null http://localhost:6006`
3. Navigate to http://localhost:6006 and verify it loads correctly
4. Click on at least **2 different stories** in the sidebar and verify each renders without errors. Use `agent-browser snapshot` to verify the rendered content and `agent-browser console` to check for console errors (ignore warnings and known noise)
5. Stop the dev server process when done: `kill $(lsof -t -i:6006) 2>/dev/null || true; fuser -k 6006/tcp 2>/dev/null || true`

## Step 3: Update agent skills

Run this after the validation loop so the skill gate sees the final versions — a package reverted in Step 2 is lagging, so its skill is skipped and stays as is.

Dispatch a subagent for the `_update-skills` skill.

If the report shows a drift stop or a `pnpx skills add` failure, open an issue with the report and continue with whatever was updated:

```bash
gh issue create   --title "[agent] Failed to update agent skills"   --body "## Failed agent skill update

<The subagent's report>

## Workflow run

$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
```

Then check whether anything changed at all:

```bash
git status --porcelain
```

If the output is empty, there are no dependency or skill updates. STOP immediately. You are done.

## Step 4: Success

All validations passed.

### 4a: Create a changeset (if needed)

Only include `@squide/*` packages whose `dependencies` or `peerDependencies` have actually changed. Agent skill updates never need a changeset. Do NOT include packages where only `devDependencies` changed — devDependency-only changes do not affect the published package. If no `@squide/*` packages qualify (i.e., every change is devDependency-only), skip this step entirely — do NOT create a changeset file.

Create a changeset file at `.changeset/update-deps-<YYYYMMDD-HHMMSS>.md` (use the current UTC date-time to avoid filename collisions with unreleased changesets). Use `patch` as the default bump level, but use your judgment to bump as `minor` or `major` if warranted by the dependency changes.

Example format:

```markdown
---
"@squide/core": patch
---

Updated dependencies to their latest versions.
```

### 4b: Commit and create pull request

Close any existing open dependency-update PRs before creating a new one:

```bash
gh pr list --search "chore: update dependencies" --state open --json number --jq '.[].number' | xargs -I{} gh pr close {} --comment "Superseded by a newer dependency update run."
```

Then create the new PR with the body described below.

#### How to write the Summary section

Before writing the summary, run `git diff main -- '**/package.json'` to see the actual changes. Then apply these rules:

1. In unified diff output, context lines start with a SPACE character, removed lines start with a single `-`, and added lines start with a single `+`. Only `-` and `+` lines represent actual changes — do NOT include dependencies that only appear on space-prefixed context lines.
2. Deduplicate: list each dependency name + version change only once, even if it appears in multiple package.json files.
3. If a dependency appears in different categories across packages (e.g., peerDependencies in a library and devDependencies in a sample), list all categories it belongs to (e.g., "peerDependencies, devDependencies").
4. Format each as: `package-name`: `old-version` → `new-version` (category), where category is dependencies, peerDependencies, or devDependencies.
5. Sort by category priority: peerDependencies first, then dependencies, then devDependencies. If a dependency belongs to multiple categories, sort it by its highest-priority category.
6. Highlight any peerDependency range narrowing with "(range narrowed — may break consumers)" — these affect consumers.
7. Do NOT mention transitive dependencies (pnpm-lock.yaml only).
8. If no `package.json` changed, write "No dependency updates." instead.

#### How to write the Agent skills section

From the `_update-skills` report: list the updated skills, then the skipped skills with their lagging package (installed → latest). Flag any updated skill whose `SKILL.md` now declares `model:` frontmatter. If the skills step didn't update anything, write "No agent skill updates." and still list the skipped skills.

#### PR body template

```markdown
## Summary

<list the updated dependencies here, following the rules above>

## Agent skills

<list the updated and skipped agent skills here, following the rules above>

## Validation checklist
- [x] Step 2a: Linting
- [x] Step 2b: Tests
- [x] Step 2c: Endpoints sample app
- [x] Step 2d: Storybook sample app
```

If Step 2 was skipped because no `package.json` changed, leave the four boxes unchecked and append "(skipped — no dependency updates)" to each.

#### Create the PR

```bash
BRANCH_NAME="agent/update-deps-$(date -u +%Y%m%d-%H%M%S)"
git checkout -b "$BRANCH_NAME"
git add -A
git commit -m "chore: update dependencies"
git push origin "$BRANCH_NAME"

gh pr create \
  --base main \
  --head "$BRANCH_NAME" \
  --title "chore: update dependencies $(date -u +%Y-%m-%d)" \
  --body "<use the PR body template above>"
```

Then STOP. You are done.

## Step 5: Failure

You have exhausted 10 validation attempts. Do NOT create a pull request.

```bash
gh issue create \
  --title "[agent] Cannot update dependencies" \
  --body "<Include: which step(s) failed, error messages, what fixes were attempted, and a link to: $GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID>"
```

Then STOP. You are done.
