---
order: 300
label: Setup with LLMs
---

# Setup with LLMs

Information about the Squide libraries can be shared with different LLMs using the Context7 MCP server. Context7 is a specialized MCP server that provides real-time, version-specific programming documentation and code examples directly to AI development tools and assistants.

==- :icon-light-bulb: More about Context7 MCP server
Context7 is an MCP server that provides AI assistants with real-time, version-specific programming documentation and code examples. Instead of relying only on a model's training data, it allows AI tools to fetch up-to-date information directly from authoritative sources (such as the code repository or the official documentation) at request time. This helps reduce hallucinations and errors caused by outdated APIs, especially in coding environments such as IDEs or editor integrations.

:link: [Lean more about Context7](https://context7.com/)
===

## Setup with VS Code

### Marketplace

For a quick setup, install the Context7 MCP server directly from the VS Code Marketplace:

[<img alt="Install in VS Code (npx)" src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install%20Context7%20MCP&color=0098FF" />](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22context7%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40upstash%2Fcontext7-mcp%40latest%22%5D%7D)&nbsp;&nbsp;&nbsp;[<img alt="Install in VS Code Insiders (npx)" src="https://img.shields.io/badge/VS_Code_Insiders-VS_Code_Insiders?style=flat-square&label=Install%20Context7%20MCP&color=24bfa5" />](https://insiders.vscode.dev/redirect?url=vscode-insiders%3Amcp%2Finstall%3F%7B%22name%22%3A%22context7%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40upstash%2Fcontext7-mcp%40latest%22%5D%7D)

### Configuration file

Alternatively, you can configure the MCP server manually by updating the VS Code [MCP configuration file](https://code.visualstudio.com/docs/copilot/customization/mcp-servers):

+++ Remote server connection
```json
"mcp": {
    "servers": {
        "context7": {
            "type": "http",
            "url": "https://mcp.context7.com/mcp",
            "headers": {
                "CONTEXT7_API_KEY": "YOUR_OPTIONAL_API_KEY"
            }
        }
    }
}
```
+++ Local server connection
```json
"mcp": {
    "servers": {
        "context7": {
            "type": "stdio",
            "command": "npx",
            "args": ["-y", "@upstash/context7-mcp", "--api-key", "YOUR_OPTIONAL_API_KEY"]
        }
    }
}
```
+++

!!!tip
For more details about supported clients and configurations, refer to the Context7 [clients documentation](https://context7.com/docs/resources/all-clients).
!!!

### Verify the connection

Open the Extensions view in VS Code and locate the `context7` MCP server. Click the gear icon to access its settings and confirm that the server is running:

:::align-image-left
![VS Code server status](../static/vscode-context7-mcp-server.png){width=449}
:::

## Setup with Claude Code

To install Context7 with Claude Code, open a terminal and execute one of the following command:

+++ Remote server connection
```bash
claude mcp add --header "CONTEXT7_API_KEY: YOUR_OPTIONAL_API_KEY" --transport http context7 https://mcp.context7.com/mcp
```
+++ Local server connection
```bash
claude mcp add context7 -- pnpmx -y @upstash/context7-mcp --api-key YOUR_OPTIONAL_API_KEY
```
+++

!!!tip
For more details and alternative installation options, refer to the Context7 [Claude Code documentation](https://context7.com/docs/clients/claude-code).
!!!

### Verify the connection

Open Claude Code and execute the `/mcp` command:

:::align-image-left
![Claude Code MCP list](../static/claude-code-mcp-list.avif){width=422}
:::

Then, select the `Context7 MCP server` to view its details, including connection status, authentication, and available tools:

:::align-image-left
![Claude Code server details](../static/claude-code-mcp-details.avif){width=636}
:::

Alternatively, you can verify the connection from a terminal by executing the `claude mcp list` command. The `context7` MCP server should be listed as **connected**.

## Try it :rocket:

Once the MCP server is set up, ask the LLM to use Context7 to perform tasks such as generating boilerplate code:

```
use context7 "/workleap/wl-squide" library to generate a new local module project.
```
