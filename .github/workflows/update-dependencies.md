---
name: Update Dependencies
description: Updates all monorepo dependencies weekly and validates the changes.

on:
  schedule: weekly on tuesday around 9am
  workflow_dispatch:

permissions: read-all

timeout-minutes: 120

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

**CRITICAL RULES:**

- You MUST track the validation attempt count starting at 0.
- After 10 failed validation attempts, you MUST immediately go to Step 4 (Failure). Do NOT keep retrying.
- You MUST call exactly ONE of the following safe-output tools before finishing:
  - `mcp__safeoutputs__create_pull_request` if validation passes (Step 3)
  - `mcp__safeoutputs__create_issue` if validation fails after 10 attempts (Step 4)
- Do NOT call `mcp__safeoutputs__noop` at any point.

## Step 1: Update dependencies

First, install the current dependencies so that tooling (like syncpack) is available:

```bash
pnpm install
```

Then, update all dependencies to their latest versions:

```bash
pnpm update-outdated-deps
```

Reset the monorepo to ensure a clean state:

```bash
pnpm reset
```

Finally, do a fresh install with the updated dependencies:

```bash
pnpm install
```

## Step 2: Validation loop

Initialize your attempt counter to 0.

Execute **all** of the validation steps below in order. If **any step fails**:

1. Increment the attempt counter.
2. If the counter reaches 10, **immediately go to Step 4 (Failure)**. Do NOT retry.
3. Otherwise, attempt to fix the issue and restart from Step 2a.

### Step 2a: Linting

Run linting from the root of the workspace:

```bash
pnpm lint
```

All checks must pass with zero errors.

### Step 2b: Tests

Run the tests from the root of the workspace:

```bash
pnpm test
```

All tests must pass.

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

All validations passed. Now create the pull request.

### 3a: Create a changeset

Create a changeset file at `.changeset/update-dependencies.md` to release the updated packages. Updating dependencies should typically bump with a **patch** version, but use your judgment for minor or major bumps if warranted by the dependency changes.

The changeset file format is:

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

### 3b: Commit changes

Stage and commit all changes (updated package.json files, pnpm-lock.yaml, and the changeset file):

```bash
git add -A
git commit -m "chore: update dependencies"
```

### 3c: Create the pull request

Use the `mcp__safeoutputs__create_pull_request` tool with:

- **title:** `update dependencies YYYY-MM-DD` (using today's date)
- **body:** A summary of the dependency updates, including a list of the notable version changes.

## Step 4: Failure

The validation loop has failed 10 times. Do NOT create a pull request.

Use the `mcp__safeoutputs__create_issue` tool with:

- **title:** `Cannot update dependencies`
- **body:** A detailed explanation of what went wrong, which validation step(s) failed, the error messages, and any relevant stack traces. Include the date of the attempted update.
