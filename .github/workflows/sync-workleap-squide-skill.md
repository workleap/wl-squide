---
name: Sync Workleap Squide Skill
description: Syncs the workleap-squide agent skill with documentation changes in docs/.

on:
  push:
    branches: [main]
    paths: ["docs/**"]
  workflow_dispatch:

permissions: read-all

timeout-minutes: 60

concurrency:
  group: sync-workleap-squide-skill
  cancel-in-progress: true

engine:
  id: claude
  version: latest

steps:
  - name: Expose push context
    env:
      BEFORE_SHA: ${{ github.event.before || '' }}
    run: |
      echo "PUSH_BEFORE_SHA=$BEFORE_SHA" >> "$GITHUB_ENV"

tools:
  bash:
    - "git:*"
    - "node:*"
  edit: {}

safe-outputs:
  create-pull-request:
    title-prefix: "[agentic] chore(skill): "
    base-branch: main
    draft: false
    fallback-as-issue: true
  create-issue:
    title-prefix: "[agentic] "
    close-older-issues: true
---

# Sync Workleap Squide Skill

You are an automated agent responsible for keeping the `workleap-squide` agent skill in sync with the documentation in `./docs`.

## Safe-output rules

You MUST call exactly ONE safe-output tool before finishing, UNLESS the guards determine no action is needed or no skill files were changed (in which case, just end without calling any safe-output tool):

- On success (all validations pass and there are changes): call `mcp__safeoutputs__create_pull_request`
- On failure (validations fail): call `mcp__safeoutputs__create_issue`
- On no changes or guard triggered: do NOT call any safe-output tool, just end.

Do NOT call `mcp__safeoutputs__noop`.

## Constraints

When updating the skill:

- Do NOT change the skill structure or file format.
- Do NOT embed metadata in skill files.
- Do NOT add "Sources:" lines to skill files.
- Do NOT create any new files outside `agent-skills/workleap-squide/`.

---

## Step 0: Docs-change gate

If `$GITHUB_EVENT_NAME` is `push` AND `$PUSH_BEFORE_SHA` is non-empty and is not all zeros:

```bash
git diff --name-only "$PUSH_BEFORE_SHA".."$GITHUB_SHA" -- docs/
```

If the output is empty (no `docs/` files changed), STOP immediately. Print "Skipping: no docs/ files changed in this push" and end without calling any safe-output tool.

If `$GITHUB_EVENT_NAME` is `workflow_dispatch`, skip this guard and proceed.

## Step 1: Update skill

Review the `workleap-squide` skill you created in the `./agent-skills/workleap-squide` directory and make sure that all API definition and examples match the current documentation available in the `./docs` folder. Ignore anything related to microfrontends, module federation, webpack, rsbuild or updates. Do not make any mistake.

Validate that the skill can still answer the following questions:

* What is Squide and what problems does it solve in frontend applications?
* How do you create a new Squide application from scratch?
* How do I structure an application using Squide?
* What does modular architecture mean in the context of a Squide application?
* How do you register local modules in a Squide application?
* What is the Firefly runtime and what role does it play in a Squide app?
* How do you register routes in a Squide module?
* How do you register navigation items for your modular application?
* What are deferred navigation items and when should you use them?
* How do you register MSW request handlers in a module?
* What is the difference between public and protected pages in Squide?
* How does Squide help with global protected data fetching?
* What hooks or helpers does Squide provide for public global data fetching?
* How do you use the event bus to communicate between modules?
* How can you integrate logging into a Squide application?
* What is the approach to environment variables in a Squide app?
* How do you integrate and use feature flags (e.g., with LaunchDarkly) in Squide?
* What is the recommended way to orchestrate page data fetching and rendering flow?
* How do you set custom Honeycomb attributes for observability in Squide?
* How do plugins work in Squide and when should you use them?
* What are common pitfalls when registering modules, routes, or navigation items in Squide?

## Step 1b: Check for changes

After updating the skill, check whether any files were actually modified:

```bash
git diff --name-only HEAD
git ls-files --others --exclude-standard -- agent-skills/workleap-squide/
```

If both commands produce empty output (no changes at all), STOP immediately. Print "No skill changes needed — skill is already in sync." and end without calling any safe-output tool.

## Step 2: Validations

Run both validations using the single inline script below. Execute this script exactly as shown. Do NOT skip any validation. If the script exits with non-zero, save the full output and go to Step 4 (Failure).

```bash
node << 'VALIDATION_EOF'
const { execSync } = require("child_process");
const fs = require("fs");

let failed = false;
const errors = [];

// --- Validation A: Allowed paths ---
console.log("--- Validation A: Allowed paths ---");
const diffOut = execSync("git diff --name-only HEAD").toString().trim();
const untrackedOut = execSync("git ls-files --others --exclude-standard").toString().trim();
const changed = [...new Set(
  [...diffOut.split("\n"), ...untrackedOut.split("\n")].filter(Boolean)
)];

if (changed.length === 0) {
  console.log("No files changed.");
} else {
  const disallowed = changed.filter(f => !f.startsWith("agent-skills/workleap-squide/"));
  if (disallowed.length > 0) {
    failed = true;
    errors.push(
      "Validation A FAILED - files outside allowed paths:\n" +
      disallowed.map(f => "  " + f).join("\n")
    );
    console.log("FAILED");
  } else {
    console.log("PASSED: all changed files within agent-skills/workleap-squide/");
  }
}

// --- Load skill content ---
const tracked = execSync("git ls-files agent-skills/workleap-squide")
  .toString().trim().split("\n").filter(Boolean);
const newFiles = execSync("git ls-files --others --exclude-standard agent-skills/workleap-squide")
  .toString().trim().split("\n").filter(Boolean);
const skillFiles = [...new Set([...tracked, ...newFiles])];

let allContent = "";
for (const file of skillFiles) {
  allContent += fs.readFileSync(file, "utf-8") + "\n";
}
const lower = allContent.toLowerCase();

// --- Validation B: Q&A evidence ---
console.log("\n--- Validation B: Q&A evidence ---");
const topics = [
  { name: "Squide basics", keywords: ["squide", "module", "application"], mode: "all" },
  { name: "Firefly runtime", keywords: ["firefly"], mode: "all" },
  { name: "Routes", keywords: ["route"], mode: "all" },
  { name: "Navigation", keywords: ["navigation"], mode: "all" },
  { name: "Deferred navigation", keywords: ["deferred"], mode: "all" },
  { name: "MSW", keywords: ["msw"], mode: "all" },
  { name: "Public/Protected", keywords: ["public", "protected"], mode: "all" },
  { name: "Global data fetching", keywords: ["global", "fetch"], mode: "all" },
  { name: "Event bus", keywords: ["event bus", "eventbus"], mode: "any" },
  { name: "Logging", keywords: ["logging"], mode: "all" },
  { name: "Env vars", keywords: ["environment", "variable"], mode: "all" },
  { name: "Feature flags", keywords: ["feature", "flag"], mode: "all" },
  { name: "Honeycomb", keywords: ["honeycomb"], mode: "all" },
  { name: "Plugins", keywords: ["plugin"], mode: "all" }
];

const missingTopics = [];
for (const t of topics) {
  if (t.mode === "any") {
    if (!t.keywords.some(kw => lower.includes(kw))) {
      missingTopics.push({ name: t.name, missing: t.keywords });
    }
  } else {
    const missing = t.keywords.filter(kw => !lower.includes(kw));
    if (missing.length > 0) {
      missingTopics.push({ name: t.name, missing });
    }
  }
}

if (missingTopics.length > 0) {
  failed = true;
  const details = missingTopics
    .map(t => "  - " + t.name + ": missing [" + t.missing.join(", ") + "]")
    .join("\n");
  errors.push("Validation B FAILED - missing Q&A evidence:\n" + details);
  console.log("FAILED");
} else {
  console.log("PASSED: all Q&A evidence keywords found");
}

// --- Summary ---
console.log("\n===========================");
if (failed) {
  console.error("VALIDATION FAILED");
  errors.forEach(e => console.error("\n" + e));
  process.exit(1);
} else {
  console.log("ALL VALIDATIONS PASSED");
}
VALIDATION_EOF
```

If the script exits with non-zero, go to Step 4 (Failure).

## Step 3: Success

All validations passed.

### 3a: Generate branch name

```bash
BRANCH_NAME="agent/skill-sync-$(date -u +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD)"
echo "Branch: $BRANCH_NAME"
```

Store this branch name for the safe-output call.

### 3b: Commit changes

```bash
git add agent-skills/workleap-squide/
git commit -m "chore(skill): sync workleap-squide skill with docs"
```

### 3c: Create the pull request

Call the `mcp__safeoutputs__create_pull_request` tool with:

- **title:** `sync workleap-squide skill`
- **branch:** the generated `$BRANCH_NAME` from step 3a
- **labels:** `["agent-skill-sync"]`
- **body:** Include:
  1. A short summary of what was updated in the skill (which sections changed, what was aligned with docs)
  2. Validation checklist:
     - [x] Validation A: Allowed paths
     - [x] Validation B: Q&A evidence

Then STOP. You are done.

## Step 4: Failure

One or more validations failed. Do NOT create a pull request. Do NOT commit changes.

Call the `mcp__safeoutputs__create_issue` tool with:

- **title:** `Cannot sync workleap-squide skill`
- **body:** Include:
  1. Which validation(s) failed and why
  2. The full validation script output and error logs
  3. Workflow run link: `$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID`
  4. Note that the branch was not pushed due to validation failure

Then STOP. You are done.
