# agent-docs/

This folder contains structured documentation for AI agents working in this repository.

Start with [AGENTS.md](../AGENTS.md) at the workspace root — it is the table of contents
that routes you to the right document here.

## Structure

```
agent-docs/
├── docs/
│   ├── design/        # Squide design patterns (routing, data fetching, registrations, etc.)
│   ├── specs/         # Package specifications and APIs
│   ├── references/    # Development setup, build tooling, CI/CD, release process, agent skills
│   └── quality/       # Testing, validation, browser checks
├── decisions/         # Architecture Decision Records (ADRs)
└── scripts/           # Supporting scripts for automation
```

## How this is maintained

This documentation can be updated by running the
[update-agent-docs](../.github/workflows/update-agent-docs.yml) workflow manually.
The workflow uses the prompt at [.github/prompts/update-agent-docs.md](../.github/prompts/update-agent-docs.md).
