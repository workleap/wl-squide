# ODR-0013: Dependency Updates Without an Agent

## Status

proposed

## Context

The weekly `update-dependencies.yml` workflow was one job running one agent prompt. The agent updated the dependencies, installed them, linted, tested, drove a browser, fixed what broke, committed, pushed, opened the pull request and filed the issues. That job held `contents: write`, `pull-requests: write`, `issues: write`, `id-token: write` and the Anthropic API key, so a dependency version published that week ran next to all of them. A malicious release of any dependency could have pushed to the repository.

Two more facts shaped the decision:

- Over its last 14 weekly runs, the agent's source fixes reached 8 pull requests and none was merged. The migrations that did land were done by hand.
- The pull request was opened with the Claude App token, so CI, the smoke test and the code review started on it before anyone had read the diff. The smoke test installs the dependencies in a job that holds `id-token: write`.

## Options Considered

1. **Keep the agent, move the push to a second job** — The agent's job loses the write token but keeps the model key, in the job that runs the new versions. Hiding the key from subprocesses is best effort: the action's own post step receives it, and its files are writable by anything that ran before.
2. **Plain steps that install and validate, then a job that opens the pull request** — No agent, but the patch and the pull request text are written after the new versions ran, so a malicious release authors what gets published. That job also runs on `main`'s ref, where it can write the caches other workflows restore.
3. **Resolve without installing, and let the pull request's CI run the new versions** — A read-only job resolves the versions into the `package.json` files and the lockfile with tools from `main`'s lockfile, and a second job, limited to `git` and `gh`, opens a draft pull request. Nothing in the scheduled workflow runs the new versions.

## Decision

Option 3. `agent-docs/references/ci-cd.md` describes the two jobs and the rules that keep them apart, and `.github/scripts/updateDependenciesWorkflow.test.ts` enforces them.

The pull request is opened with the job token, as a draft. A pull request opened that way starts no workflow until a maintainer approves its runs, and a draft keeps that approval from starting the smoke test and the code review. The first run of the new versions is therefore always in `ci.yml` and `pr-pkg.yml`, which hold a read-only token, no secret, and a cache scoped to the pull request.

## Consequences

- The scheduled workflow holds no secret and no `id-token`, and runs no agent. A run takes a few minutes and costs no model usage.
- A maintainer has to approve the workflow runs of the weekly pull request before CI validates it.
- A breaking update is no longer fixed or reverted by the workflow: it shows as a red CI on the draft pull request and is fixed on its branch.
- The workflow no longer updates the installed agent skills. That update needs an agent today, so it runs locally with `/_update-skills` until it is scripted.
- The browser checks of the endpoints and Storybook samples are gone from the weekly run.
- Files that an install regenerates, such as the `mockServiceWorker.js` files after an `msw` update, are committed by hand on the pull request branch.
- The changeset always bumps as a patch. Whoever reviews the pull request raises it when a change warrants more.
- A later push to the pull request branch starts the smoke test like on any other pull request. Its credentials are out of scope here.
