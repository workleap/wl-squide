Create a GitHub Agentic Workflow (gh-aw) file:

  .github/workflows/sync-workleap-squide-skill.md

Repo structure:
- Docs: ./docs/**
- Skill: ./agent-skills/workleap-squide/**

Constraints:
- Do NOT change the skill structure/format.
- Do NOT embed metadata.
- Do NOT add “Sources:” lines.
- Do NOT add repo scripts (no new files under ./scripts).
- All validation must be inline inside the workflow.

Include compile instructions:
  gh aw compile .github/workflows/sync-workleap-squide-skill.md
Commit the generated .lock.yml.

Triggers:
- push to main
- workflow_dispatch

Guards (must implement):

1) Docs-change gate:
   - Compare github.event.before..github.sha
   - If no files under docs/** changed: exit success.

2) Allowed paths enforcement:
   - After update, fail if any changed file is outside:
     agent-skills/workleap-squide/**

3) Concurrency:
   - Ensure only one run at a time for main.

Branch/PR behavior:
- Create unique branch each run:
  agent/skill-sync-<YYYYMMDD>-<HHMMSS>-<shortsha>
- If no changes under agent-skills/workleap-squide/**: exit success (no PR).
- If validations pass:
  - Commit message:
    "chore(skill): sync workleap-squide skill with docs"
  - Push branch
  - Open PR title:
    "chore(skill): sync workleap-squide skill"
  - Add label: agent-skill-sync
  - Enable auto-merge (squash) if possible; otherwise merge via gh CLI.
- If validations fail:
  - Push branch
  - Open issue title:
    "[agent] Cannot sync workleap-squide skill"
  - Issue body must include:
    - which validation failed
    - logs/output
    - workflow run link
    - branch link
  - Do NOT merge; exit non-zero.

Skill update step:
Run an agent update using EXACTLY this prompt verbatim:

---
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
---

Validations (inline only; use bash/git/rg and inline node -e if needed)

Validation A — Allowed paths
- After agent modifications:
  git diff --name-only
- Fail if any file is outside agent-skills/workleap-squide/**

Validation B — Forbidden terms
- Scan ./agent-skills/workleap-squide/** (case-insensitive)
- Fail if any appear:
  microfrontend
  micro-frontends
  module federation
  webpack
  rsbuild
  dependency updates
  updating dependencies

Validation C — Deterministic “Q&A evidence” checks (no LLM scoring)
- Do NOT call an LLM to grade answers.
- Do NOT change skill structure.
- Concatenate all skill text and code blocks.
- Assert the skill still contains these evidence keywords (case-insensitive substring match):

  1) Squide basics: "Squide", "module", "application"
  2) Firefly runtime: "Firefly"
  3) Routes: "route"
  4) Navigation: "navigation"
  5) Deferred navigation: "deferred"
  6) MSW: "MSW"
  7) Public/Protected: "public", "protected"
  8) Global data fetching: "global", "fetch"
  9) Event bus: "event bus" OR "eventBus"
  10) Logging: "logging"
  11) Env vars: "environment", "variable"
  12) Feature flags: "feature", "flag"
  13) Honeycomb: "Honeycomb"
  14) Plugins: "plugin"

- If any topic is missing evidence: fail and print which topic failed and which keywords were missing.
- Also re-check forbidden terms here.

Implementation detail:
- Prefer a single inline node -e script that:
  - lists files via git ls-files agent-skills/workleap-squide
  - reads them
  - performs checks
  - prints a clear report
  - exits non-zero on failure

Output requirements:
- Provide full content of .github/workflows/sync-workleap-squide-skill.md
- Ensure validations are implemented inline (no new repo files besides the workflow).
- Provide compile instruction and mention committing the generated .lock.yml.
