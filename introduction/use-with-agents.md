# Use with agents

Information about the Squide libraries can be shared with different agents using the [workleap-squide](https://skills.sh/workleap/wl-squide/workleap-squide) agent skill.

## Install agent skill

Open a terminal and install the `workleap-squide` agent skill by running the following command:

```bash
pnpx skills add https://github.com/workleap/wl-squide --skill workleap-squide
```

!!!tip
The `skills.sh` CLI will prompt you to choose whether to install the skill globally or within a project. We recommend installing it **locally** so it is available for code review tools such as [Copilot](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review) or [Claude Code](https://github.com/anthropics/claude-code-action).
!!!

## Install agent skill with pnpm

Starting with pnpm `12.11`, the `workleap-squide` agent skill is also shipped with the `@squide/firefly` package. Instead of installing the skill with `skills.sh`, approve it when pnpm reports it during an install:

```bash
pnpm approve
```

pnpm then links the skill into the project agent skill directories, such as `.claude/skills`, and keeps it matched with the installed version of `@squide/firefly`. For more information, refer to the pnpm [agent skills](https://pnpm.io/agent-skills) documentation.

!!!warning
Install the skill either with `skills.sh` or with pnpm, not both, otherwise agents will load the skill twice.
!!!

## Try it :rocket:

Once the skill is installed, start an agent and ask it to create a new Squide project:

```
Generate a Squide project with an host application and a local module.
```
