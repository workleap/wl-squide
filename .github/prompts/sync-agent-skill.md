# Sync Workleap Squide Skill

You are an automated agent responsible for keeping the `workleap-squide` agent skill in sync with the documentation in `./docs`.

## Constraints

Before updating the skill, read [ADR-0030](../../agent-docs/adr/0030-skill-body-reference-split.md). It explains the body/reference split — which sections stay in SKILL.md and which belong in `references/`. Violating this split will re-introduce bloat.

When updating the skill:

- Do NOT change the format of existing skill files.
- You MAY create new `references/*.md` files when new content does not fit any existing reference file.
- Do NOT embed metadata in skill files.
- Do NOT add "Sources:" lines to skill files.
- Do NOT create or modify any files outside `agent-skills/workleap-squide/`.
- Do NOT use TodoWrite, TaskCreate, or any task tracking tools.
- Never update a versioned skill. You can identify a versioned skill with its folder name pattern, e.g. `workleap-squide-v*`.
- Never change skill content unless you can point to a specific line in `./docs` that contradicts the current skill text. If you cannot identify the exact discrepancy, do not touch the content.
- The SKILL.md body must stay under ~250 lines. New API content goes in the appropriate `references/` file, not in the body. Only add to the body if the content is a critical multi-file pattern that agents need in nearly every conversation.

## Excluded docs

The following docs are **not** part of the skill and must be ignored:

- `docs/updating/` — Version migration guides
- `docs/static/` — Static image assets for the documentation site
- `docs/_includes/` — Documentation site configuration templates
- `docs/module-federation/` — Module Federation and microfrontend architecture
- `docs/reference/webpack/` — Webpack build configuration for Module Federation
- `docs/reference/rsbuild/` — Rsbuild build configuration for Module Federation (experimental)
- `docs/reference/module-federation/` — Module Federation-specific API overloads
- `docs/default.md` — Documentation site redirect page
- `docs/about.md` — Repository metadata and contribution info
- `docs/samples.md` — Links to external sample applications
- `docs/troubleshooting.md` — Debug tips and Module Federation context issues
- `docs/introduction/use-with-agents.md` — Meta-docs about using the agent skill itself
- `docs/introduction/deploy.md` — Deployment and operational concerns
- `docs/reference/packages.md` — NPM package table with no API content

All other `.md` files under `docs/` are in scope.

## Docs-to-skill file routing

Use this table to decide which skill file to update for a given docs path:

| Skill file | Primary docs sources |
|---|---|
| `SKILL.md` | `docs/introduction/*`, `docs/essentials/*` |
| `references/runtime-api.md` | `docs/reference/runtime/*`, `docs/reference/registration/*` |
| `references/hooks-api.md` | `docs/reference/routing/*`, `docs/reference/global-data-fetching/*`, `docs/reference/messaging/*` |
| `references/integrations.md` | `docs/integrations/*` |
| `references/patterns.md` | `docs/essentials/*`, `docs/recipes/*` |
| `references/components.md` | `docs/reference/routing/*` |

If a doc does not match any row above, use your best judgment to route it to the most relevant skill file. Always respect the "Excluded docs" section — never sync content from excluded paths.

---

## Step 1: Update skill

Review the existing `workleap-squide` skill in `./agent-skills/workleap-squide/` and make sure that all API definitions and examples match the current documentation available in `./docs`. Use the routing table above to target your comparisons. Skip any paths listed in the "Excluded docs" section.

## Step 2: Check for changes

After updating the skill, check whether any files were actually modified:

```bash
git diff --name-only HEAD -- agent-skills/workleap-squide/
git ls-files --others --exclude-standard -- agent-skills/workleap-squide/
```

If both commands produce empty output (no changes at all), STOP immediately. Print "No skill changes needed — skill is already in sync." You are done.

## Step 3: Validate

Spawn a subagent with the `Task` tool using the **opus** model to validate the updated skill with a fresh context. The subagent validates from two angles: (1) can the skill answer key questions, and (2) are the API signatures and examples factually correct compared to the actual docs.

Use the following prompt for the subagent:

> You are a validator for the `workleap-squide` agent skill. Your job is to verify both **coverage** and **accuracy**.
>
> ## Part A — Coverage
>
> Read all files in `./agent-skills/workleap-squide/`. Using ONLY those files, determine whether the skill can adequately answer each question below. For each, respond PASS or FAIL with a brief explanation.
>
> 1. What is Squide and what problems does it solve in frontend applications?
> 2. How do you create a new Squide application from scratch?
> 3. How do I structure an application using Squide?
> 4. What does modular architecture mean in the context of a Squide application?
> 5. How do you register local modules in a Squide application?
> 6. What is the Firefly runtime and what role does it play in a Squide app?
> 7. How do you register routes in a Squide module?
> 8. How do you register navigation items for your modular application?
> 9. What are deferred navigation items and when should you use them?
> 10. How do you register MSW request handlers in a module?
> 11. What is the difference between public and protected pages in Squide?
> 12. How does Squide help with global protected data fetching?
> 13. What hooks or helpers does Squide provide for public global data fetching?
> 14. How do you use the event bus to communicate between modules?
> 15. How can you integrate logging into a Squide application?
> 16. What is the approach to environment variables in a Squide app?
> 17. How do you integrate and use feature flags (e.g., with LaunchDarkly) in Squide?
> 18. What is the recommended way to orchestrate page data fetching and rendering flow?
> 19. How do you set custom Honeycomb attributes for observability in Squide?
> 20. How do plugins work in Squide and when should you use them?
> 21. What are common pitfalls when registering modules, routes, or navigation items in Squide?
>
> ## Part B — Accuracy
>
> Now read all `.md` files under `./docs/`, excluding the paths listed in the "Excluded docs" section of `./.github/prompts/sync-agent-skill.md`. For each code example and API signature in the skill files, verify it matches the docs. Report any discrepancies: wrong parameter names, missing arguments, incorrect types, outdated patterns.
>
> ## Output
>
> End with:
> - `COVERAGE: X/21 PASSED`
> - `ACCURACY: list of discrepancies (or "No discrepancies found")`

If any coverage question is marked FAIL or accuracy discrepancies are found, go back to Step 1 and fix the gaps. Retry at most 3 times. If validation passes, proceed to Step 4. If validation still fails after 3 retries, proceed to Step 4 anyway but include the unresolved issues in the PR (see Step 4c).

## Step 4: Success

### 4a: Increment version

Read the `metadata.version` field in the YAML frontmatter of `agent-skills/workleap-squide/SKILL.md`. Increment the **minor** part of the version (e.g., `1.0` → `1.1`, `5.3` → `5.4`). Update the file with the new version.

### 4b: Create branch and commit

```bash
BRANCH_NAME="agent/skill-sync-$(date -u +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD)"
git checkout -b "$BRANCH_NAME"
git add agent-skills/workleap-squide/
git commit -m "chore(skill): sync workleap-squide skill with docs [skip ci]"
git push origin "$BRANCH_NAME"
```

### 4c: Create pull request

If validation passed cleanly:

```bash
gh pr create \
  --base main \
  --head "$BRANCH_NAME" \
  --title "chore(skill): sync workleap-squide skill" \
  --body "## Summary

<Write a short summary of what was updated in the skill>"
```

If validation still had failures after 3 retries, create the PR anyway but include a warnings section:

```bash
gh pr create \
  --base main \
  --head "$BRANCH_NAME" \
  --title "chore(skill): sync workleap-squide skill" \
  --body "## Summary

<Write a short summary of what was updated in the skill>

## ⚠️ Validation Warnings

The following issues could not be resolved after 3 retries:

<List the failed coverage questions and/or accuracy discrepancies>"
```

Then STOP. You are done.
