---
description: Bump the repo's GitHub Actions `uses:` refs to their latest released versions, preserving each ref's style, tree left dirty for review. On-demand only — Renovate stays the scheduled path. Use as "/_update-github-actions" or when asked to update, bump, or refresh the project's GitHub Actions.
model: sonnet
effort: medium
metadata:
  internal: true
---

# Update GitHub Actions

Bring every GitHub Actions `uses:` ref up to its latest release. Do the steps in order; stop and surface any failure. Never prompt — the run is unattended.

Renovate (`renovate.json`) updates GitHub Actions on a schedule; this skill is the on-demand local equivalent. Match its behavior so the two never disagree: keep each ref's existing style (Renovate doesn't pin digests here) and ignore releases younger than 7 days (the shared preset's `minimumReleaseAge`).

## 0. Check `gh`

`gh auth status` fails -> **stop**: tell the user to run `! gh auth login`.

## 1. Inventory

Collect every `uses:` value in `.github/workflows/*.yml` and `.github/actions/**/action.y*ml`, at step and job level (reusable workflows: `owner/repo/.github/workflows/x.yml@ref`).

- Skip local (`./…`) and `docker://` refs.
- Map each ref to its `owner/repo` — the first two path segments. Subpath actions share their repo's version: `actions/cache/restore` and `actions/cache/save` are `actions/cache` and always move together.

## 2. Classify each ref

| Style | Example | Update rule |
|---|---|---|
| Major tag | `actions/checkout@v7` | Bump to the latest major (`@v8`) — only if that major tag exists |
| Full semver tag | `foo/bar@v1.2.3` | Bump to the latest semver tag, same precision |
| SHA pin | `changesets/action@<sha> # v2.1.2` | Replace the SHA with the latest tag's commit SHA and update the comment |
| Floating | `retypeapp/action-build@latest`, a branch name | Never touch — report only |

## 3. Find the latest version

Per unique `owner/repo` (parallelize):

1. List tags: `gh api repos/{o}/{r}/tags --paginate --jq '.[].name'`. Keep only full semver tags (`vX.Y.Z` or `X.Y.Z`), drop prereleases, take the highest. Don't use `releases/latest` — it returns the newest release by date, which can be a backport on an older major.
2. Age gate: read the tag's commit date (`gh api repos/{o}/{r}/commits/{tag} --jq '.commit.committer.date'`). Younger than 7 days -> fall back to the highest tag that is old enough.
3. Major-tag refs: confirm the target major tag exists with `gh api repos/{o}/{r}/git/ref/tags/v{N}`. Missing -> stay on the highest existing major tag; note it.
4. SHA pins: resolve the chosen tag to its commit SHA with `gh api repos/{o}/{r}/commits/{tag} --jq .sha` (follows annotated tags).

A lookup fails -> mark that repo `ERROR` with the message and move on.

## 4. Print the table

Before editing anything:

```
action                 | current          | latest   | status
actions/checkout       | v7               | v8       | UPDATE (major)
actions/cache          | v6               | v6       | current
changesets/action      | ae32849 # v2.1.2 | v2.2.0   | UPDATE
retypeapp/action-build | latest           | —        | SKIP (floating)
```

## 5. Edit

Apply every `UPDATE` row in every file that references it, preserving the ref style from step 2 and the line's formatting. Touch nothing else.

For each **major** bump, diff the `inputs:` of the action's `action.yml` (or the reusable workflow's `on.workflow_call.inputs`) between the old and new tag — `gh api repos/{o}/{r}/contents/{path}/action.yml?ref={tag} --jq .content | base64 -d`. Flag any input this repo passes (`with:`) that was removed or renamed, or any newly required input. Don't adjust the workflows yourself.

## Report

- Actions bumped (old -> new) with the files touched — confirm via `git status --short .github`.
- Major bumps, each with its release notes link (`https://github.com/{o}/{r}/releases/tag/{tag}`) and any input incompatibility from step 5 — these are the likely breakage points, verified only once CI runs.
- Skipped refs: floating, held back by the 7-day age gate, or missing major tag.
- Lookup errors (full message).

No changeset is needed — these files aren't published.
