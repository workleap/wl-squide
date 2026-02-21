---
order: 20
label: Use with agents
toc:
    depth: 2-3
---

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

## Try it :rocket:

Once the skill is installed, start an agent and ask it to create a new Squide project:

```
Generate a Squide project with an host application and a local module.
```
