---
name: Update Dependencies
description: Updates all monorepo dependencies weekly and validates the changes.

on:
  schedule: weekly on tuesday around 9am
  workflow_dispatch:

permissions: read-all

timeout-minutes: 60

concurrency:
  group: update-dependencies
  cancel-in-progress: true

# The AWF sandbox container (image 0.20.0) is missing basic coreutils (e.g. "tee")
# that the Claude Code CLI depends on, causing it to crash with "command not found".
# We also tried mounting pnpm into the container (option 1: npm install + mount,
# option 2: hostedtoolcache mount, default chroot mode) but none made pnpm available
# inside the container despite AWF docs claiming host PATH is captured automatically.
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

steps:
  - name: Install pnpm
    uses: pnpm/action-setup@v4
    with:
      run_install: false

# The "tools" and "playwright.allowed_domains" restrictions are only enforced when the
# sandbox is enabled. Kept here so they're ready when the sandbox is re-enabled.
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

You MUST call exactly ONE safe-output tool before finishing, UNLESS Step 1 determines there are no direct dependency updates (in which case, just end without calling any safe-output tool):

- On success (all validations pass): call `mcp__safeoutputs__create_pull_request`
- On failure (10 attempts exhausted or preflight failed): call `mcp__safeoutputs__create_issue`
- On no updates (no `package.json` files changed): do NOT call any safe-output tool, just end.

Do NOT call `mcp__safeoutputs__noop`.

## No skipping steps

You MUST execute every validation step (2a, 2b, 2c, 2d) in order. Do NOT skip any step for any reason (complexity, time, confidence, etc.). If a step is listed, it MUST be performed. The ONLY acceptable reason to not execute a step is if a previous step failed — in that case, go to Step 4 (Failure) after exhausting attempts.

---

## Step 0: Preflight check

Run this command first:

```bash
pnpm --version
```

If this fails or `pnpm` is not found, STOP immediately and go to Step 4 (Failure) with the message: "pnpm is not available in the sandbox container." Do NOT attempt to install pnpm yourself (no `npx pnpm`, no `npm install -g pnpm`, no `corepack`). The workflow setup is broken and must be fixed in the workflow configuration.

## Step 1: Update dependencies

Update all dependencies to their latest versions:

```bash
pnpm update-outdated-deps
```

Then, check if any `package.json` files were modified (excluding `node_modules`):

```bash
git diff --name-only -- '**/package.json' ':!node_modules'
```

If the output is empty (no `package.json` files were modified), there are no direct dependency updates. STOP immediately — do NOT run `pnpm install`, do NOT run the validation loop, do NOT create a pull request or issue, do NOT call any safe-output tool. The workflow is done.

Otherwise, install the updated dependencies:

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

```bash
pnpm test
```

All tests must pass. Do NOT report test counts, suite counts, or package names in the PR body. Just confirm tests passed.

### Step 2c: Validate the "endpoints" sample app

You MUST use Playwright for this step. Running a build is NOT sufficient — you must start the dev server, and follow ALL of the above steps.

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

You MUST use Playwright for this step. Running a build is NOT sufficient — you must start the dev server, and follow ALL of the above steps.

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

Create a changeset file at `.changeset/update-dependencies.md`. Only include `@squide/*` packages whose `package.json` files have actually changed (i.e. packages that had direct dependencies updated). Do NOT include packages that were unaffected. Use `patch` as the default bump level, but use your judgment to bump as `minor` or `major` if warranted by the dependency changes.

Example format:

```markdown
---
"@squide/core": patch
"@squide/some-other-package": patch
---

Updated dependencies to their latest versions.
```

### 3b: Commit changes

```bash
git add -A
git commit -m "chore: update dependencies"
```

### 3c: Create the pull request

Call the `mcp__safeoutputs__create_pull_request` tool with:

- **title:** `update dependencies YYYY-MM-DD` (using today's date)
- **body:** The body MUST include the following sections:

  1. **Summary**: A summary of the top-level dependency updates, including notable version changes. Only mention dependencies explicitly listed in the monorepo `package.json` files — do NOT mention sub-dependencies (transitive dependencies updated in the lock file).
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
