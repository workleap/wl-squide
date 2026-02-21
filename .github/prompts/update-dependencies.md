# Update Dependencies

You are an automated agent responsible for updating the dependencies of this monorepo and validating that everything still works correctly.

## Constraints

- You have a maximum of **10 attempts** to pass all validation steps. If you exhaust all attempts, go to Step 3 (Failure).
- You MUST execute every validation step (2a, 2b, 2c, 2d) in order. Do NOT skip any step.

---

## Step 1: Update dependencies

Update all dependencies to their latest versions:

```bash
pnpm update-outdated-deps
```

Then, check if any `package.json` files were modified:

```bash
git diff --name-only -- '**/package.json' ':!node_modules'
```

If the output is empty, there are no dependency updates. STOP immediately. You are done.

Otherwise, install the updated dependencies:

```bash
pnpm install
```

## Step 2: Validation loop

Run steps 2a through 2d in order. If ANY step fails, diagnose and fix the issue before retrying. Read error messages carefully, inspect failing source code, look up changelogs or migration guides for packages with breaking changes, then apply the fix and restart from Step 2a.

### Step 2a: Linting

```bash
pnpm lint
```

All checks must pass with zero errors.

### Step 2b: Tests

```bash
pnpm test
```

All tests must pass.

### Step 2c: Validate the "endpoints" sample app

Use `agent-browser` for this step. Read the locally installed agent skill at `.agents/skills/agent-browser/` to learn how to use it. Running a build is NOT sufficient — you must start the dev server and validate in a real browser.

1. Start the dev server in the background: `pnpm dev-endpoints`
2. Wait for the server to be ready on `http://localhost:8080`
3. Navigate to the following pages and check that each renders without errors:
   - `/` (Home page)
   - `/subscription`
   - `/federated-tabs`
   - `/federated-tabs/episodes`
   - `/federated-tabs/locations`
4. For each page:
   - Take a snapshot to verify the page rendered content
   - Check the browser console for unexpected errors (ignore warnings and known noise like network errors from fake APIs or MSW)
5. Stop the dev server process when done

### Step 2d: Validate the "storybook" sample app

Use `agent-browser` for this step. Read the locally installed agent skill at `.agents/skills/agent-browser/` to learn how to use it. Running a build is NOT sufficient — you must start the dev server and validate in a real browser.

1. Start the dev server in the background: `pnpm dev-storybook`
2. Wait for the server to be ready (check the output for the URL)
3. Navigate to the Storybook URL
4. Validate that the Storybook interface loads correctly
5. Take a snapshot to verify the page rendered content
6. Check the browser console for unexpected errors
7. Stop the dev server process when done

## Step 3: Success

All validations passed.

### 3a: Create a changeset

Create a changeset file at `.changeset/update-dependencies.md`. Only include `@squide/*` packages whose `package.json` files have actually changed. Use `patch` as the default bump level, but use your judgment to bump as `minor` or `major` if warranted by the dependency changes.

Example format:

```markdown
---
"@squide/core": patch
---

Updated dependencies to their latest versions.
```

### 3b: Commit and create pull request

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
  --body "## Summary

<Summary of top-level dependency updates and notable version changes. Only mention dependencies explicitly listed in the monorepo package.json files — do NOT mention transitive dependencies.>

## Validation checklist
- [x] Step 2a: Linting
- [x] Step 2b: Tests
- [x] Step 2c: Endpoints sample app
- [x] Step 2d: Storybook sample app"
```

Then STOP. You are done.

## Step 4: Failure

You have exhausted 10 validation attempts. Do NOT create a pull request.

```bash
gh issue create \
  --title "[agent] Cannot update dependencies" \
  --body "<Include: which step(s) failed, error messages, what fixes were attempted, and a link to: $GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID>"
```

Then STOP. You are done.
