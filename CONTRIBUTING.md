# Contributing

The following documentation is only for the maintainers of this repository.

- [Monorepo setup](#monorepo-setup)
- [Project overview](#project-overview)
- [Installation](#installation)
- [Develop the packages](#develop-the-packages)
- [Release the packages](#release-the-packages)
- [Update the agent skill](#update-the-agent-skill)
- [Deploy the sample applications](#deploy-the-sample-applications)
- [Available workflows](#workflows)
- [Available hooks](#hooks)
- [Available commands](#commands)
- [CI](#ci)
- [Add a new package to the monorepo](#add-a-new-package-to-the-monorepo)

## Monorepo setup

This repository is managed as a monorepo with [PNPM workspace](https://pnpm.io/workspaces) to handle the installation of the npm dependencies and manage the packages interdependencies.

It's important to note that PNPM workspace doesn't hoist the npm dependencies at the root of the workspace as most package manager does. Instead, it uses an advanced [symlinked node_modules structure](https://pnpm.io/symlinked-node-modules-structure). This means that you'll find a `node_modules` directory inside the packages folders as well as at the root of the repository.

The main difference to account for is that the `devDependencies` must now be installed locally in every package `package.json` file rather than in the root `package.json` file.

### Turborepo

This repository use [Turborepo](https://turbo.build/repo/docs) to execute it's commands. Turborepo help saving time with it's built-in cache but also ensure the packages topological order is respected when executing commands.

To be understand the relationships between the commands, have a look at this repository [turbo.json](./turbo.json) configuration file.

### JIT packages

When possible, the packages and the sample applications' projects are configured for [JIT packages](https://www.shew.dev/monorepos/packaging/jit).

## Project overview

This project is split into three major sections, [packages/](packages/), [samples/](samples/) and [templates/](templates/).

### Packages

Under [packages/](packages/) are the actual packages composing the modular application shell.

### Samples

Under [samples/](samples/) are applications to test the Squide functionalities while developing.

You'll find four samples:

- `basic`: A sample application showcasing the basic features of Squide.
- `basic-webpack`: A sample application showcasing the basic features of Squide using webpack as a bundle.
- `endpoints`: A more complexe sample application showcasing the different usecases related to data fetching and localization.
- `storybook`: A sample application the Storybook integration.

## Installation

This project uses PNPM, therefore, you must install [PNPM](https://pnpm.io/installation) v9+ first:

```bash
npm install -g pnpm
```

To install the dependencies of this repository, open a terminal at the root of the workspace and execute the following command:

```bash
pnpm install
```

### Setup environment variables

Ids, keys and tokens must set to send data to the different development environment of the telemetry platforms.

First, create a file named `.env.local` at the root of the workspace:

```
workspace
├── package.json
├── .env.local
```

Then, add the following key/values to the newly created `.env.local` file:

- `LOGROCKET_APP_ID`: The application id of the `frontend-platform-team-dev` LogRocket project.
- `HONEYCOMB_API_KEY`: The API key of the `frontend-platform-team-dev` Honeycomb environment.
- `LAUNCH_DARKLY_CLIENT_ID`: The API key of the `Frontend-platform-team` LaunchDarkly environment.

> [!NOTE]
> The `.env.local` file is configured to be ignored by Git and will not be pushed to the remote repository.

### Setup Retype

[Retype](https://retype.com/) is the documentation platform that Squide is using for its documentation. As this project is leveraging a few [Pro features](https://retype.com/pro/) of Retype.

Everything should work fine as-is but there are a few limitations to use Retype Pro features without a wallet. If you want to circumvent these limitations, you can optionally, setup your [Retype wallet](https://retype.com/guides/cli/#retype-wallet).

To do so, first make sure that you retrieve the Retype license from your Vault (or ask IT).

Then, open a terminal at the root of the workspace and execute the following command:

```bash
npx retype wallet --add <your-license-key-here>
```

## Develop the packages

Open a [VSCode terminals](https://code.visualstudio.com/docs/terminal/basics#_managing-multiple-terminals) and start one of the sample application with one of the following scripts:

```bash
pnpm dev-basic
```

or

```bash
pnpm dev-basic-webpack
```

or

```bash
pnpm dev-endpoints
```

or

```bash
pnpm dev-storybook
```

You can then open your favorite browser and navigate to `http://localhost:8080/` to get a live preview of your code.

> To test that a remote module is working correctly, navigate to the remote module entry file. For a remote module hosted on the port `8081`, the URL should be `http://localhost:8081/remoteEntry.js`.

### LogRocket

The sample applications' telemetry data is sent to the `frontend-platform-team-dev` project in LogRocket.

### Honeycomb

Depending on the sample application, traces are sent to the corresponding project within the `frontend-platform-team-dev` environment in Honeycomb:

- `endpoints`: `squide-endpoints-sample`

To query the traces, go to the query dashboard of your Honeycomb project, input `root.name = squide-bootstrapping` into the `WHERE` condition field and run the query.

## Release the packages

When you are ready to release the packages, you must follow the following steps:

1. Run `pnpm changeset` and follow the prompt. For versioning, always follow the [SemVer standard](https://semver.org/).
2. Commit the newly generated file in your branch and submit a new Pull Request (PR). Changesets will automatically detect the changes and post a message in your pull request telling you that once the PR closes, the versions will be released.
3. Find someone to review your PR.
4. Merge the Pull request into `main`. A GitHub action will automatically trigger and update the version of the packages and publish them to [npm](https://www.npmjs.com/). A tag will also be created on GitHub tagging your PR merge commit.

### Troubleshooting

#### Github

Make sure you're Git is clean (No pending changes).

#### NPM

Make sure GitHub Action has **write access** to the selected npm packages.

#### Compilation

If the packages failed to compile, it's easier to debug without executing the full release flow every time. To do so, instead, execute the following command:

```bash
pnpm build-pkg
```

By default, packages compilation output will be in their respective *dist* directory.

## Update the agent skill

By default, the [sync-agent-skill](.github/workflows/sync-agent-skill.yml) workflow updates the skill automatically. If changes are required, it opens a pull request with the appropriate modifications.

If the workflow does not behave as expected, the simplest way to update an agent skill is to use an agent:

1. Start your preferred agent.
2. Copy the content of [UPDATE_SKILL.md](./prompts/UPDATE_SKILL.md) into the agent prompt.
3. Commit the changes and merge the pull request.

NOTE: Skills installed using [skills.sh](https://skills.sh/) are sourced directly from the repository files. Merging the pull request is therefore sufficient to update the installed skill.

## Deploy the sample applications

### The "basic" sample application

The sites for this sample application are hosted on [Netlify](https://www.netlify.com/):

- [host](https://squide-basic-host.netlify.app/)
- [remote-module](https://squide-basic-remote-module.netlify.app)
- [another-remote-module](https://squide-basic-another-remote-module.netlify.app)

To deploy the sample application, open a terminal at the root of the repository and execute the following script:

```bash
pnpm deploy-basic
```

A prompt with a few questions will appear and then the site will automatically be deployed to production.

### The sample application with "endpoints"

The sites for this sample application are hosted on [Netlify](https://www.netlify.com/):

- [host](https://squide-endpoints-host.netlify.app/)
- [remote-module](https://squide-endpoints-remote-module.netlify.app)
- [remote-module (isolated)](https://squide-endpoints-remote-isolated.netlify.app/)

To deploy the sample application, open a terminal at the root of the repository and execute the following script:

```bash
pnpm deploy-endpoints
```

A prompt with a few questions will appear and then the sites will automatically be deployed to production.

Then, execute the following script:

```bash
pnpm deploy-endpoints-isolated
```

Another prompt with a few questions will appear and then the sites will automatically be deployed to production.

## Workflows

The following workflows are available with GitHub:

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI | `.github/workflows/ci.yml` | Push to main, PRs | Build, lint, typecheck, test |
| Changeset | `.github/workflows/changeset.yml` | Push to main | Version bumps and npm publish |
| PR packages | `.github/workflows/pr-pkg.yml` | PRs | Publish preview packages |
| Update dependencies | `.github/workflows/update-dependencies.yml` | Weekly (Tue 14:00 UTC) | Automated dependency updates |
| Code review | `.github/workflows/code-review.yml` | PRs | Automated code review |
| Claude | `.github/workflows/claude.yml` | @claude mentions | Interactive AI assistance |
| Sync agent skill | `.github/workflows/sync-agent-skill.yml` | Push to main (docs/) | Sync Squide skill with docs |
| Retype | `.github/workflows/retype-action.yml` | Push to main, PRs | Build and deploy documentation site |
| Audit monorepo | `.github/workflows/audit-monorepo.yml` | First day of month | Best practices audit |
| Update agent docs | `.github/workflows/update-agent-docs.yml` | Push to main | Sync agent-docs/ with docs and code |

## Hooks

### Pre-commit

A [Claude Code hook](https://docs.anthropic.com/en/docs/claude-code/hooks) is configured in `.claude/settings.json` to run `pnpm lint` before every commit made through Claude Code. The hook intercepts `git commit` Bash tool calls and blocks the commit if linting fails.

| File | Purpose |
|------|---------|
| `.claude/settings.json` | Registers a `PreToolUse` hook on the `Bash` tool |
| `.claude/hooks/pre-commit.sh` | Filters for `git commit` commands and runs `pnpm lint` |

#### Testing the hook

To verify the hook blocks commits with lint errors, create a temporary file with a deliberate violation — for example, `packages/core/src/__test_lint_error.ts` containing `const x = 1;` (an unused variable). Stage it with `git add`, then ask Claude to commit. The hook runs `pnpm lint`, and because ESLint reports errors, it exits with code 2. You should see a message like `PreToolUse:Bash hook error: Lint failed. Fix errors before committing.` and the commit will not be created. Delete the test file when done.

## Commands

From the project root, you have access to many commands. The most important ones are:

### dev-basic

Start a watch process for the "basic" sample application.

```bash
pnpm dev-basic
```

### dev-basic-webpack

Start a watch process for the "basic" sample application using a webpack bundler.

```bash
pnpm dev-basic-webpack
```

### dev-endpoints

Start a watch process for the "endpoints" sample application.

```bash
pnpm dev-endpoints
```

### dev-storybook

Start a watch process for the Storybook sample application.

```bash
pnpm dev-storybook
```

### dev-docs

Start the [Retype](https://retype.com/) dev server. If you are experiencing issue with the license, refer to the [setup Retype section](#setup-retype).

```bash
pnpm dev-docs
```

### build-pkg

Build the packages for release.

```bash
pnpm build-pkg
```

### build-basic

Build the "basic" sample application for release.

```bash
pnpm build-basic
```

### build-basic-webpack

Build for release the "basic" sample application using webpack bundler.

```bash
pnpm build-basic-webpack
```

### build-endpoints

Build the "endpoints" sample application for release.

```bash
pnpm build-endpoints
```

### build-storybook

Build for deploy the Storybook sample application.

```bash
pnpm build-storybook
```

### serve-basic

Build the sample "basic" application for deployment and start a local web server to serve the application.

```bash
pnpm serve-basic
```

### serve-basic-webpack

Build the sample "basic" application using webpack bundler for deployment and start a local web server to serve the application.

```bash
pnpm serve-basic-webpack
```

### serve-endpoints

Build the sample "endpoints" application for deployment and start a local web server to serve the application.

```bash
pnpm serve-endpoints
```

### serve-storybook

Build the sample Storybook application and start a local web server to serve the application.

```bash
pnpm serve-storybook
```

### test

Run the unit tests.

```bash
pnpm test
```

### lint

Lint the files.

```bash
pnpm lint
```

### changeset

To use when you want to publish a new package version. Will display a prompt to fill in the information about your new release.

```bash
pnpm changeset
```

### clean

Clean the packages and the sample applications (delete `dist` folder, clear caches, etc..)

```bash
pnpm clean
```

### reset

Reset the workspace installation (delete `dist` folders, clear caches, delete `node_modules` folders, etc..)

```bash
pnpm reset
```

### list-outdated-deps

Checks for outdated dependencies. For more information, view [PNPM documentation](https://pnpm.io/cli/outdated).

```bash
pnpm list-outdated-deps
```

### update-outdated-deps

Update outdated dependencies to their latest version. For more information, view [PNPM documentation](https://pnpm.io/cli/update).

```bash
pnpm update-outdated-deps
```

## CI

We use [GitHub Actions](https://github.com/features/actions) for this repository.

You can find the configuration in the [.github/workflows](.github/workflows/) folder and the build results are available [here](https://github.com/workleap/wl-squide/actions).

We currently have 3 builds configured:

### Changesets

This action runs on a push on the `main` branch. If there is a file present in the `.changeset` folder, it will publish the new package version on npm.

### CI

This action will trigger when a commit is done in a PR to `main` or after a push to `main` and will run `build-pkg`, `build-basic`, `build-basic-webpack`, `build-basic-mix`, `build-endpoints`, `lint` and `test` commands on the source code.

### Retype

This action will trigger when a commit is done in a PR to `main` or after a push to `main`. The action will generate the documentation website into the `retype` branch. This repository [Github Pages](https://github.com/workleap/wl-squide/settings/pages) is configured to automatically deploy the website from the `retype` branch.

If you are having issue with the Retype license, make sure the `RETYPE_API_KEY` Github secret contains a valid Retype license.

## Add a new package to the monorepo

There are a few steps to add new packages to the monorepo.

Before you add a new package, please read the [Workleap GitHub guidelines](https://github.com/workleap/github-guidelines#npm-package-name).

### Create the package

First, create a new folder matching the package name in the [packages](/packages) folder.

Open a terminal, navigate to the newly created folder, and execute the following command:

```bash
pnpm init
```

Answer the CLI questions.

Once the `package.json` file is generated, please read again the [Workleap GitHub guidelines](https://github.com/workleap/github-guidelines#npm-package-name) and make sure the package name, author and license are valid.

Don't forget to add the [npm scope](https://docs.npmjs.com/about-scopes) `"@squide"` before the package name. For example, if the project name is "foo", your package name should be `@squide/foo`.

Make sure the package publish access is *public* by adding the following to the `package.json` file:

```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

### sideEffects

Make sure to add a `sideEffect` field to the `package.json` file:

```json
{
  "sideEffects": false
}
```

Most of the time, the value will be `false` but if your package contains CSS or any other [side effect](https://sgom.es/posts/2020-06-15-everything-you-never-wanted-to-know-about-side-effects/), make sure to set the value accordingly.

### Dependencies

npm *dependencies* and *peerDependencies* must be added to the package own *package.json* file.
