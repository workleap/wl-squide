---
order: 20
label: Use with agents
toc:
    depth: 2-3
---

# Use with agents

Information about the Squide libraries can be shared with different agents using the [workleap-squide](https://skills.sh/workleap/wl-squide/workleap-squide) agent skill.

## Install agent skill

Starting with pnpm `12.11` and `@squide/firefly` `20.1.0`, the `workleap-squide` agent skill is shipped with the `@squide/firefly` package. Approve it when pnpm reports it during an install:

```bash
pnpm approve
```

pnpm then links the skill into the project agent skill directories, such as `.claude/skills`, and keeps it matched with the installed version of `@squide/firefly`. For more information, refer to the pnpm [agent skills](https://pnpm.io/agent-skills) documentation.

!!!tip
If the skill was previously installed with `skills.sh`, remove it, otherwise agents will load the skill twice:

```bash
pnpm dlx skills@latest remove workleap-squide
```

If the skill was installed globally, add the `--global` option:

```bash
pnpm dlx skills@latest remove workleap-squide --global
```
!!!

## Try it :rocket:

Once the skill is installed, start an agent and ask it to create a new Squide project:

```
Generate a Squide project with an host application and a local module.
```
