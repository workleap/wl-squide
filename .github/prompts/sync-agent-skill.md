# Sync Workleap Squide Skill

You are an automated agent responsible for keeping the `workleap-squide` agent skill in sync with the documentation in `./docs`.

## Constraints

When updating the skill:

- Do NOT change the skill structure or file format.
- Do NOT embed metadata in skill files.
- Do NOT add "Sources:" lines to skill files.
- Do NOT create any new files outside `agent-skills/workleap-squide/`.

---

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

## Step 2: Check for changes

After updating the skill, check whether any files were actually modified:

```bash
git diff --name-only HEAD
git ls-files --others --exclude-standard -- agent-skills/workleap-squide/
```

If both commands produce empty output (no changes at all), STOP immediately. Print "No skill changes needed — skill is already in sync." You are done.

### Increment version

Read the `metadata.version` field in the YAML frontmatter of `agent-skills/workleap-squide/SKILL.md`. Increment the **major** part of the version (e.g., `1.0` → `2.0`, `5.0` → `6.0`). Update the file with the new version.

## Step 3: Validate

Spawn a subagent using the `Task` tool to validate the updated skill with a fresh context. The subagent must NOT have access to the `./docs` folder — it should only use the skill files.

Use the following prompt for the subagent:

> You are a validator. Read all files in the `./agent-skills/workleap-squide/` directory. Using ONLY the content of those files, determine whether the skill can adequately answer each of the following questions. Do NOT read any other files.
>
> For each question, respond with PASS or FAIL and a brief explanation.
>
> Questions:
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
> At the end, output a summary line: `RESULT: X/21 PASSED`

If any question is marked FAIL, go back to Step 1 and fix the gap, then re-run this validation. If all 21 questions pass, proceed to Step 4.

## Step 4: Success

### 4a: Create branch and commit

```bash
BRANCH_NAME="agent/skill-sync-$(date -u +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD)"
git checkout -b "$BRANCH_NAME"
git add agent-skills/workleap-squide/
git commit -m "chore(skill): sync workleap-squide skill with docs"
git push origin "$BRANCH_NAME"
```

### 4b: Create pull request

```bash
gh pr create \
  --base main \
  --head "$BRANCH_NAME" \
  --title "chore(skill): sync workleap-squide skill" \
  --body "## Summary

<Write a short summary of what was updated in the skill>"
```

Then STOP. You are done.

## Step 5: Failure

If you cannot successfully update the skill or the skill cannot answer all questions, do NOT create a pull request. Do NOT commit changes.

```bash
gh issue create \
  --title "[agent] Cannot sync workleap-squide skill" \
  --body "<Include what went wrong and a link to: $GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID>"
```

Then STOP. You are done.
