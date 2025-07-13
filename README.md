# ynab-mcp-server
[![smithery badge](https://smithery.ai/badge/@calebl/ynab-mcp-server)](https://smithery.ai/server/@calebl/ynab-mcp-server)

A Model Context Protocol (MCP) server built with mcp-framework. This MCP provides tools
for interacting with your YNAB budgets setup at https://ynab.com

<a href="https://glama.ai/mcp/servers/@calebl/ynab-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@calebl/ynab-mcp-server/badge" alt="YNAB Server MCP server" />
</a>

In order to have an AI interact with this tool, you will need to get your Personal Access Token
from YNAB: https://api.ynab.com/#personal-access-tokens. When adding this MCP server to any
client, you will need to provide your personal access token as YNAB_API_TOKEN. **This token
is never directly sent to the LLM.** It is stored privately in an environment variable for
use with the YNAB api.

## Setup
Specify env variables:
* YNAB_API_TOKEN (required)
* YNAB_BUDGET_ID (optional)

## Goal
The goal of the project is to be able to interact with my YNAB budget via an AI conversation.
There are a few primary workflows I want to enable:

## Workflows:
### First time setup
* be prompted to select your budget from your available budgets. If you try to use another
tool first, this prompt should happen asking you to set your default budget.
  * Tools needed: ListBudgets
### Manage overspent categories
### Adding new transactions
### Approving transactions
### Check total monthly spending vs total income
### Auto-distribute ready to assign funds based on category targets

## Current state
Available tools:
* ListBudgets - lists available budgets on your account
* BudgetSummary - provides a summary of categories that are underfunded and accounts that are low
* GetUnapprovedTransactions - retrieve all unapproved transactions
* CreateTransaction - creates a transaction for a specified budget and account.
  * example prompt: `Add a transaction to my Ally account for $3.98 I spent at REI today`
  * requires GetBudget to be called first so we know the account id
* ApproveTransaction - approves an existing transaction in your YNAB budget
  * requires a transaction ID to approve
  * can be used in conjunction with GetUnapprovedTransactions to approve pending transactions
  * After calling get unapproved transactions, prompt: `approve the transaction for $6.95 on the Apple Card`

Next:
* be able to approve multiple transactions with 1 call
* updateCategory tool - or updateTransaction more general tool if I can get optional parameters to work correctly with zod & mcp framework
* move off of mcp framework to use the model context protocol sdk directly?


## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

```

## MCP Client Installation

This project supports integration with the most popular MCP clients. Follow the instructions below for your preferred environment:

### Cline

1. **Install Cline**: [Cline Download & Docs](https://docs.cline.bot/)
2. **Install the Cline VS Code Extension** (recommended for best experience)
3. **Add this MCP server**:
   - Use the Cline MCP Marketplace (Extensions tab in Cline) to search for and install `ynab-mcp-server`.
   - Or, add manually in your Cline MCP settings (see [Cline MCP Docs](https://docs.cline.bot/mcp-servers/mcp-server-from-github)).
4. **Set your YNAB API token** in the MCP server config or as an environment variable.

### Cursor

1. **Install Cursor IDE**: [Cursor Download](https://www.cursor.so/)
2. **Install Node.js** (required for MCP servers): [Node.js Download](https://nodejs.org/)
3. **Add the MCP Installer** (recommended):
   - Run: `npm install -g cursor-mcp-installer-free`
   - Or use: `npx cursor-mcp-installer-free`
   - Add to your Cursor MCP config (`~/.cursor/mcp.json` on Mac/Linux, `%USERPROFILE%\.cursor\mcp.json` on Windows):
     ```json
     {
       "mcpServers": {
         "ynab-mcp-server": {
           "command": "npx",
           "args": ["ynab-mcp-server"]
         }
       }
     }
     ```
   - Restart Cursor to apply changes.

### Claude Desktop

1. **Install Claude Desktop**: [Claude Desktop Download](https://www.anthropic.com/desktop)
2. **Install Node.js** (required for MCP servers): [Node.js Download](https://nodejs.org/)
3. **Add this MCP server**:
   - Open your Claude Desktop config file:
     - **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
     - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
     - **Linux**: `~/.config/Claude/claude_desktop_config.json`
   - Add:
     ```json
     {
       "mcpServers": {
         "ynab-mcp-server": {
           "command": "npx",
           "args": ["ynab-mcp-server"]
         }
       }
     }
     ```
   - Restart Claude Desktop.

### ChatGPT (via MCP SuperAssistant)

1. **Install the MCP SuperAssistant Chrome Extension**: [Chrome Web Store](https://chrome.google.com/webstore/detail/mcp-superassistant/)
2. **Run the local proxy**:
   ```bash
   npx @srbhptl39/mcp-superassistant-proxy@latest --config ./mcpconfig.json
   ```
   - Use your MCP config file (can reuse Claude's config if available).
3. **Open ChatGPT** (or Perplexity, Gemini, etc.) in Chrome.
4. **Activate the MCP SuperAssistant sidebar** and connect to your local proxy.
5. **Use MCP tools** directly in ChatGPT conversations.

For more details, see the [MCP SuperAssistant GitHub](https://github.com/srbhptl39/MCP-SuperAssistant).

## Project Structure

```
ynab-mcp-server/
├── src/
│   ├── tools/        # MCP Tools
│   └── index.ts      # Server entry point
├── .cursor/
│   └── rules/        # Cursor AI rules for code generation
├── package.json
└── tsconfig.json
```

## Adding Components

The YNAB sdk describes the available api endpoints: https://github.com/ynab/ynab-sdk-js.

YNAB open api specification is here: https://api.ynab.com/papi/open_api_spec.yaml. This can
be used to prompt an AI to generate a new tool. Example prompt for Cursor Agent:

```
create a new tool based on the readme and this openapi doc: https://api.ynab.com/papi/open_api_spec.yaml

The new tool should get the details for a single budget
```

You can add more tools using the CLI:

```bash
# Add a new tool
mcp add tool my-tool

# Example tools you might create:
mcp add tool data-processor
mcp add tool api-client
mcp add tool file-handler
```

## Tool Development

Example tool structure:

```typescript
import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface MyToolInput {
  message: string;
}

class MyTool extends MCPTool<MyToolInput> {
  name = "my_tool";
  description = "Describes what your tool does";

  schema = {
    message: {
      type: z.string(),
      description: "Description of this input parameter",
    },
  };

  async execute(input: MyToolInput) {
    // Your tool logic here
    return `Processed: ${input.message}`;
  }
}

export default MyTool;
```

## Publishing to npm

1. Update your package.json:
   - Ensure `name` is unique and follows npm naming conventions
   - Set appropriate `version`
   - Add `description`, `author`, `license`, etc.
   - Check `bin` points to the correct entry file

2. Build and test locally:
   ```bash
   npm run build
   npm link
   ynab-mcp-server  # Test your CLI locally
   ```

3. Login to npm (create account if necessary):
   ```bash
   npm login
   ```

4. Publish your package:
   ```bash
   npm publish
   ```

After publishing, users can add it to their claude desktop client (read below) or run it with npx


## Using with Claude Desktop

### Installing via Smithery

To install YNAB Budget Assistant for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@calebl/ynab-mcp-server):

```bash
npx -y @smithery/cli install @calebl/ynab-mcp-server --client claude
```

### Local Development

Add this configuration to your Claude Desktop config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ynab-mcp-server": {
      "command": "node",
      "args":["/absolute/path/to/ynab-mcp-server/dist/index.js"]
    }
  }
}
```

### After Publishing

Add this configuration to your Claude Desktop config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ynab-mcp-server": {
      "command": "npx",
      "args": ["ynab-mcp-server"]
    }
  }
}
```

### Other MCP Clients
Check https://modelcontextprotocol.io/clients for other available clients.

## Building and Testing

1. Make changes to your tools
2. Run `npm run build` to compile
3. The server will automatically load your tools on startup

## Learn More

- [MCP Framework Github](https://github.com/QuantGeekDev/mcp-framework)
- [MCP Framework Docs](https://mcp-framework.com)

## Security

This project is designed with security in mind:
- The YNAB API token is only read from the environment and is never logged, printed, or sent to any third party (including LLMs).
- All network activity is limited to the official YNAB API.
- No shell commands, dynamic code execution, or arbitrary file/network access is present.
- All user input is validated and sanitized.
- Debugging scripts only interact with the YNAB API and do not expose sensitive data.

**Best Practices:**
- Always keep your YNAB token secure and do not log it.
- Only run this server in trusted environments.
- Keep dependencies up to date and from official sources.
