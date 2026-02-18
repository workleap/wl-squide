---
name: Update Dependencies
description: Updates all monorepo dependencies weekly and validates the changes.

on:
  schedule: weekly on tuesday around 9am
  workflow_dispatch:

permissions: read-all

timeout-minutes: 120

# Required to set "sandbox.agent: false".
strict: false

sandbox:
  # Steps runs on the host, but the agent runs in a container that doesn't inherit the host's installed tools.
  # So pnpm/action-setup in steps doesn't help without disabling the sandbox for the agent.
  agent: false

engine:
  id: claude
  model: claude-sonnet-4-5-20250929
  max-turns: 200

steps:
  - name: Install pnpm
    uses: pnpm/action-setup@v4
    with:
      run_install: false

tools:
  bash:
    - "pnpm:*"
    - "git:*"
    - "node:*"
    - "pnpx:*"
    - "kill:*"
    - "lsof:*"
    - "sleep:*"
    - "curl:*"
  edit: {}
  web-fetch: {}
  playwright:
    allowed_domains: ["localhost"]

safe-outputs:
  create-pull-request:
    title-prefix: "[agentic] chore: "
    base-branch: main
    draft: false
    fallback-as-issue: true
  create-issue:
    title-prefix: "[agentic] "
    close-older-issues: true
---

# Update Dependencies

You are an automated agent responsible for updating the dependencies of this monorepo and validating that everything still works correctly.

## Attempt tracking

You MUST maintain a variable called `attempt_count` starting at 0. Every time a validation step (2a, 2b, 2c, or 2d) fails and you restart the loop, increment `attempt_count` by 1. Before each restart, check: **if `attempt_count` >= 10, STOP immediately and go to Step 4 (Failure).** Do NOT attempt an 11th try under any circumstance.

## Safe-output rules

You MUST call exactly ONE safe-output tool before finishing:

- On success (all validations pass): call `mcp__safeoutputs__create_pull_request`
- On failure (10 attempts exhausted): call `mcp__safeoutputs__create_issue`

Do NOT call `mcp__safeoutputs__noop`. Do NOT finish without calling one of the two tools above.

## No skipping steps

You MUST execute every validation step (2a, 2b, 2c, 2d) in order. Do NOT skip any step for any reason (complexity, time, confidence, etc.). If a step is listed, it MUST be performed. The ONLY acceptable reason to not execute a step is if a previous step failed — in that case, go to Step 4 (Failure) after exhausting attempts.

---

## Step 1: Update dependencies

Update all dependencies to their latest versions:

```bash
pnpm update-outdated-deps
```

Then, install the updated dependencies:

```bash
pnpm install
```

## Step 2: Validation loop

Set `attempt_count = 0`.

Run steps 2a through 2d in order. If ANY step fails:

1. Set `attempt_count = attempt_count + 1`
2. **Check: is `attempt_count` >= 10?**
   - **YES → Go to Step 4 (Failure) immediately. Do NOT retry.**
   - **NO → Diagnose and fix the issue before retrying.** Read error messages carefully, inspect the failing source code, look up changelogs or migration guides (using web-fetch) for packages with breaking changes, then apply the fix and restart from Step 2a. Do NOT give up before exhausting all 10 attempts.

### Step 2a: Linting

```bash
pnpm lint
```

All checks must pass with zero errors.

### Step 2b: Tests

Run this exact command from the workspace root:

```bash
pnpm test
```

This command runs tests for ALL packages in the monorepo via Turborepo. All tests must pass. When reporting results, list ALL packages that ran tests — not a subset. Do NOT use words like "including" that imply a partial list. Do NOT fabricate or estimate test counts — only report numbers you can directly read from the output.

### Step 2c: Validate the "endpoints" sample app

1. Start the dev server in the background: `pnpm dev-endpoints`
2. Wait for the server to be ready on `http://localhost:8080`
3. Using Playwright, navigate to `http://localhost:8080`
4. Validate the app by navigating to the following pages and checking that each renders without errors:
   - `/` (Home page)
   - `/subscription`
   - `/federated-tabs`
   - `/federated-tabs/episodes`
   - `/federated-tabs/locations`
5. For each page:
   - Take a snapshot to verify the page rendered content
   - Check the browser console for unexpected errors (ignore warnings and known noise like network errors from fake APIs or MSW)
6. Stop the dev server process when done

### Step 2d: Validate the "storybook" sample app

1. Start the dev server in the background: `pnpm dev-storybook`
2. Wait for the server to be ready (check the output for the URL)
3. Using Playwright, navigate to the Storybook URL
4. Validate that:
   - The Storybook interface loads correctly
   - Take a snapshot to verify the page rendered content
   - Check the browser console for unexpected errors
5. Stop the dev server process when done

## Step 3: Success

All validations passed.

### 3a: Create a changeset

Create a changeset file at `.changeset/update-dependencies.md` with the following content:

```markdown
---
"@squide/core": patch
"@squide/env-vars": patch
"@squide/fakes": patch
"@squide/firefly": patch
"@squide/firefly-module-federation": patch
"@squide/firefly-rsbuild-configs": patch
"@squide/firefly-rsbuild-storybook": patch
"@squide/firefly-webpack-configs": patch
"@squide/i18next": patch
"@squide/launch-darkly": patch
"@squide/msw": patch
"@squide/react-router": patch
---

Updated dependencies to their latest versions.
```

Use your judgment: bump as minor or major if warranted by the dependency changes.

### 3b: Commit changes

```bash
git add -A
git commit -m "chore: update dependencies"
```

### 3c: Create the pull request

Call the `mcp__safeoutputs__create_pull_request` tool with:

- **title:** `update dependencies YYYY-MM-DD` (using today's date)
- **body:** The body MUST include the following sections:

  1. **Summary**: A summary of the dependency updates, including notable version changes.
  2. **Validation checklist**: An explicit checklist of every step completed with a checkmark. You MUST list every step individually:
     - [ ] Step 2a: Linting
     - [ ] Step 2b: Tests
     - [ ] Step 2c: Endpoints sample app
     - [ ] Step 2d: Storybook sample app

  Mark each step with `[x]` if it passed. If a step was not executed, do NOT mark it as passed.

Then STOP. You are done.

## Step 4: Failure

You have exhausted 10 validation attempts. Do NOT create a pull request. Do NOT retry.

Call the `mcp__safeoutputs__create_issue` tool with:

- **title:** `Cannot update dependencies`
- **body:** Include:
  1. The date
  2. **Validation checklist**: An explicit checklist showing which steps were attempted and their results:
     - [ ] Step 2a: Linting
     - [ ] Step 2b: Tests
     - [ ] Step 2c: Endpoints sample app
     - [ ] Step 2d: Storybook sample app
  3. Which step(s) failed, error messages, relevant stack traces, and what fixes were attempted.

Then STOP. You are done.
