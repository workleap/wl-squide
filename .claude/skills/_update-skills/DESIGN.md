# `update-skills` — design notes

> **Maintainers only.** This file is **not** loaded by the Claude Code skill loader — only `SKILL.md` is ingested when the skill is invoked. Keep operational instructions in `SKILL.md`; keep rationale here.

The same `scripts/listSkillPins.ts` and its test live in `workleap/wl-app`, `wl-web-configs`, `wl-squide`, `wl-logging` and `wl-telemetry`. Only the `SOURCES` and `NO_COOLDOWN` constants differ. A change to the logic goes to all five.

## What the cooldown is for

A vendored skill is instructions and scripts an agent runs with this repo's permissions. The weekly job used to pull whatever upstream held that day, with whatever `skills` CLI release was newest. The cooldown makes it pull only what has been public, unchanged, for 7 days, so a poisoned or broken change has a week to be noticed and reverted by someone else first. It reviews nothing itself.

## What it guarantees

A skill is pulled only when all of these hold:

- **Folder.** The skill's folder is byte-identical (same git tree) at every position its source's default branch is known to have held over the last 7 days: where it was 7 days ago, both ends of every push since, and where the branch points now.
- **Source.** The source is the same GitHub repository (by id) on the same default branch that `SOURCES` records.
- **CLI.** The `skills` release is at least 7 days old, still served by the registry, not deprecated, not above the registry's `latest` tag, and at least 1.8.0 (the first that installs the commit it is given, going by its source).
- **CLI dependencies.** Every package that release pulls in is at least 7 days old (`minimumReleaseAge` of 10080 minutes, from the command's flag or the workspace setting).
- **Installed files.** After the pull, every installed file is a file of the folder at the pinned commit, and the skill's folder is a real folder, not a link (`--verify`).

## What it doesn't cover

- A bad change nobody notices within 7 days.
- Two unrecorded pushes in a row that change a folder and put it back. What is offered is then still the week-old content.
- The first install of a skill. The listing only covers skills already in `skills-lock.json`; see "Adding a skill".
- A skill named in `NO_COOLDOWN`: its source has no commits to pin or to age.
- GitHub or the npm registry answering wrongly, and the clock of the machine the job runs on.
- What the CLI does while it runs, beyond the files it leaves in the skill's folder.
- An agent that doesn't follow `SKILL.md`, or a `skills add` run by hand. Nothing checks the command that was run.
- Packages matched by `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`, which the dependency gate skips.
- Other places that run the `skills` CLI, such as a CI check that validates this repo's own published skill.

Not verified yet: that the Actions token can run the GraphQL lookup against other public repositories (the REST calls answer without authentication), and an install with a 1.8.x release (none was 7 days old when this was written).

## Decisions

| Decision | Choice | Why |
|---|---|---|
| What ages | The pushes GitHub recorded for the branch (`/repos/{o}/{r}/activity`), never commit dates | A commit's date is set by its author. |
| Which positions | Every position of the last 7 days, not only "now" and "7 days ago" | Content that was changed and put back inside the week looks unchanged from its two ends. |
| "7 days ago" | The end of the newest push at least 7 days old, never the start of the first recent one | GitHub sometimes fails to record a push. The next push then starts from what the lost one brought in, however young. Both ends of every recent push are kept for the same reason. |
| The head | The last recorded push; the branch ref is one more position | The record trails the ref by about a second. Reading both and comparing them raced; reading the head from the record cannot disagree with it. |
| What "unchanged" means | The folder's git tree is the same at every position, looked up 100 per GraphQL request | One sha covers every byte and file mode of the folder. A position that isn't a full sha, or where nothing is found, counts as changed. |
| The pin (`latest`) | The newest commit that changed the folder, accepted only if its folder equals the head's | The pin doesn't move when the rest of the repository does. GitHub's commits-by-path listing skips commits in some merge shapes, hence the equality check. |
| What a source is | `SOURCES`: repository id and default branch per source, changed by hand | A renamed repository keeps answering under its old name until someone else registers that name. A switched default branch can present content that sat a week where nobody looked. |
| A skill that can't be listed | Its own `problem` in the listing (`BLOCKED`); the other skills are listed | One upstream folder that moved must not freeze every skill. It happened in `wl-squide`: `dogfood` moved upstream and sat in two open issues for two weeks. |
| A run that can't start | Exit 3 with the reason on stderr | No CLI release to offer, or pnpm failed: nothing can be pulled at all. |
| The CLI release | Chosen by the script from the registry's publish times | The registry keeps the time of an unpublished release, so "old enough" must also mean "still served". Deprecating is how a maintainer flags a bad release after the unpublish window. A release above `latest` was never put forward, or was taken back. |
| The CLI's dependencies | `minimumReleaseAge` on the `pnpm dlx` that runs it | `dlx` resolves them fresh on every run with no lockfile. Checked on pnpm 12.18: the setting applies to `dlx` and `pnpx`, from the flag and from the workspace file, to transitive packages too, and an older version in range is picked when the newest is too young. |
| Checking the install | `--verify` compares each installed file's blob sha with the folder at the pinned commit | The lock's `ref` is copied from the URL the CLI was given, not from what it fetched, and before 1.8.0 the CLI installed the default branch when given `owner/repo@<commit>` (both read from its source). It goes one way (installed ⊆ source) because the CLI leaves some files out. A link is never followed and never matches. |
| Who checks the install | The skill after each pull, and again the workflow prompt wherever the skill runs in a subagent (the four open-source repos) | A subagent can end in the middle of a pull, and the prompt commits what is on disk. In `wl-app` the skill runs in the job's own session, and a run that ends early commits nothing. |
| Text from upstream in messages | A repository, branch or file name is printed only when it looks like one, and what `gh` or `pnpm` printed is cut to plain text | A `problem` is printed by an agent and pasted into an issue. |
| Tests | Everything asked of GitHub goes through one interface the tests answer from memory | The whole decision runs offline. `gh` and `pnpm` are only called by thin functions whose parsing is tested against recorded output. The arguments they pass are exercised only by real runs. |

## Measured on live data (November 2026)

- The push log trails the branch ref by 0.6 to 1.4 seconds.
- It never recorded 2 of about 2,160 pushes over 3 months on 12 upstream repositories. A lost push shows only as the start of the next one. Entries are sometimes duplicated, and some carry a time an hour late.
- With no period given the log reaches back years. The busiest week seen held 256 pushes.
- A run makes about 80 GitHub requests and takes 30 to 70 seconds.

## Rejected

- **Compare the head with one commit from 7 days ago.** The first version. It misses a change that was put back, and a lost push moves "7 days ago" to young content.
- **Require the pushes to form an unbroken chain.** It added waiting and caught nothing the positions don't.
- **Require the pin to be an ancestor of the commit from 7 days ago.** An ordinary merge defeats it, because commits-by-path simplifies history.
- **Stop the whole listing on any problem.** See "A skill that can't be listed".
- **Retry failed `gh` calls.** Not done. A transient failure blocks the skills it hit for one run and is reported in an issue.
- **Close the skills issue automatically after a clean run.** One title covers several kinds of trouble, and a run that ended early looks clean. A human closes it.
- **One shared package instead of five copies.** Set aside for now.

## Known limits

- A folder that changes at least once a week never settles and stays on `WAIT`. `vercel/turborepo`'s skill changed 72 times from July to September 2026; at most 1 of those 13 weekly runs could have pulled it. Nothing escalates a long wait.
- A push GitHub never recorded at the tip of a branch, if it touched the folder, keeps the skill on `WAIT` until a later push is 7 days old.
- A `BLOCKED` skill stays blocked until its cause is gone. A failed `gh` call clears on the next run. Anything else needs a human, and a source GitHub has no recorded push for stays blocked.
- A skill whose upstream folder holds a symbolic link can never verify: GitHub lists the link, and the CLI installs what it points to.
- After a failed pull, the agent puts the skill's lock entry back by hand (`SKILL.md` has it do so; in `wl-app`, the nightly prompt). No command does it.
- `--verify` passes an install with files missing, as long as those present match: a pull cut short can leave an incomplete skill, never content that hasn't cooled.
- A trouble that lasts is reported every run: as a comment on the open issue in the four open-source repos, as a new issue in `wl-app`.

## Adding a skill

1. Record its source in `SOURCES` if it is new: `gh api repos/<source> --jq ".id, .default_branch"`.
2. Find the newest commit that changed its folder: `gh api "repos/<source>/commits?path=<folder>&per_page=1" --jq ".[0].sha"`.
3. Install it with the command form of the table in `SKILL.md`, at that commit, with a `skills` release at least 7 days old, and add its row to the table.
4. Run the listing. `settled: true` with `latest` equal to `pinned` means what you installed has cleared the cooldown. `WAIT` means its folder changed in the last 7 days: read those changes yourself, or remove the skill and come back later.

## Checking a change to the script

- `node --test .claude/skills/_update-skills/scripts/listSkillPins.test.ts`
- Break the code on purpose and confirm a test fails. Every rule the script applies should have a test that does.
- Run the listing against the real sources, then `--verify` for each skill that has a commit pinned: each must verify.
