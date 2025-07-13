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

The following table lists all available tools provided by this MCP server, along with a brief description of each:

| Tool Name                        | Description                                                                                      |
|-----------------------------------|--------------------------------------------------------------------------------------------------|
| ListBudgets                      | Lists all available budgets from YNAB API                                                        |
| GetBudget                        | Fetches a single budget by ID from the YNAB API                                                  |
| ListAccounts                     | Lists all accounts in a YNAB budget                                                              |
| GetAccount                       | Fetches a single account by ID                                                                   |
| UpdateAccount                    | Updates the name of an account in a YNAB budget                                                  |
| ListCategories                   | Lists all categories in a YNAB budget                                                            |
| GetCategory                      | Fetches a single category by ID                                                                  |
| UpdateCategoryGoal               | Updates a category goal in a YNAB budget                                                         |
| ListMonths                       | Lists all months in a YNAB budget                                                                |
| GetMonth                         | Retrieves a single month in a YNAB budget                                                        |
| ListMonthCategories              | Lists all categories for a specific month in a YNAB budget                                       |
| GetMonthCategory                 | Fetches a category for a specific month in a YNAB budget                                         |
| ListTransactions                 | Lists all transactions (approved and unapproved) in a YNAB budget                                |
| ListAccountTransactions          | Lists all transactions for a specific account in a YNAB budget                                   |
| GetUnapprovedTransactions        | Retrieves all unapproved transactions                                                            |
| CreateTransaction                | Creates a transaction for a specified budget and account                                         |
| ApproveTransaction               | Approves an existing transaction in your YNAB budget                                             |
| UpdateTransactionFlag            | Updates the flag of a transaction                                                                |
| BulkUpdateTransactions           | Updates multiple transactions at once                                                            |
| DeleteTransaction                | Deletes a transaction from a YNAB budget                                                         |
| ListScheduledTransactions        | Lists all scheduled transactions in a YNAB budget                                                |
| ScheduledTransaction             | Get, create, update, or delete a scheduled transaction                                           |
| UpdateScheduledTransactionFlag   | Updates the flag of a scheduled transaction                                                      |
| ListAccountScheduledTransactions | Lists all scheduled transactions for a specific account in a YNAB budget                         |
| ListPayees                       | Lists all payees in a YNAB budget                                                                |
| GetPayee                         | Fetches a payee by ID                                                                            |
| UpdatePayeeName                  | Updates a payee's name                                                                           |
| ListPayeeLocations               | Lists all payee locations in a YNAB budget                                                       |
| GetPayeeLocation                 | Fetches a payee location by ID                                                                   |
| AccountReconciliation            | Reconciles an account by creating a reconciliation transaction if needed                         |
| BudgetSummary                    | Provides a summary of categories that are underfunded and accounts that are low                  |
| DeltaRequests                    | Fetches only changes (deltas) since a given server_knowledge value for a specified resource      |
| GoalManagement                   | Retrieves and summarizes goal information for all categories in a YNAB budget                    |
| GetUserInfo                      | Fetches user info from the YNAB API                                                              |
| WebhooksTool                     | Manages webhooks for YNAB events (not supported by the official YNAB API)                       |

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

## MCP Server Environment Variables

Your MCP server requires certain environment variables to function. These can be set in several ways, depending on your client and operating system.

**Supported variables:**
- `YNAB_API_TOKEN` (required): Your YNAB personal access token
- `YNAB_BUDGET_ID` (optional): Default budget ID to use
- `NODE_ENV` (optional): Node.js environment (e.g., `production`, `development`)

### How to Set Environment Variables

#### **Summary Table**

| Client             | Inline env with npx in config? | Inline env with npx in shell/CLI? | "env" in config? | .env file? | Best Practice                |
|--------------------|-------------------------------|-----------------------------------|-------------------|------------|------------------------------|
| Cline              | ❌                             | ✅                                 | ✅               | ✅         | "env" in config or shell    |
| Cursor             | ❌                             | ✅                                 | ❌               | ✅         | Shell or .env file           |
| Claude Desktop     | ❌                             | ✅                                 | ✅               | ✅         | "env" in config, shell, or .env |
| ChatGPT/SuperAsst. | ✅ (when running manually)     | ✅                                 | ❌               | ✅         | Inline, shell, or .env file  |

#### 1. **System Environment Variables (Works Everywhere)**
Set variables in your shell before launching the MCP client or server:
- **Windows (CMD):**
  ```cmd
  set YNAB_API_TOKEN=your_token_here
  set YNAB_BUDGET_ID=your_budget_id_here
  set NODE_ENV=development
  cursor
  ```
- **Windows (PowerShell):**
  ```powershell
  $env:YNAB_API_TOKEN="your_token_here"
  $env:YNAB_BUDGET_ID="your_budget_id_here"
  $env:NODE_ENV="development"
  cursor
  ```
- **Mac/Linux:**
  ```bash
  export YNAB_API_TOKEN=your_token_here
  export YNAB_BUDGET_ID=your_budget_id_here
  export NODE_ENV=development
  cursor
  ```

#### 2. **Via MCP Client Config (If Supported)**
Some clients (like Cline and Claude Desktop) allow you to specify environment variables in the MCP server config block:
```json
{
  "mcpServers": {
    "ynab-mcp-server": {
      "command": "npx",
      "args": ["github:securityvoid/ynab-mcp-server"],
      "env": {
        "YNAB_API_TOKEN": "your_token_here",
        "YNAB_BUDGET_ID": "your_budget_id_here",
        "NODE_ENV": "development"
      }
    }
  }
}
```
- **Note:** Not all clients support the `env` key. If not supported, use system environment variables or a `.env` file.

#### 3. **Using a .env File (If Supported by the Server)**
If your MCP server uses `dotenv` or similar, you can create a `.env` file in your project directory:
```
YNAB_API_TOKEN=your_token_here
YNAB_BUDGET_ID=your_budget_id_here
NODE_ENV=development
```
- The server will automatically load these variables if `dotenv` is used in your codebase.

#### 4. **Inline with npx (CLI/SuperAssistant)**
You can also pass env variables inline when running with `npx`:
- **Mac/Linux:**
  ```bash
  YNAB_API_TOKEN=your_token_here YNAB_BUDGET_ID=your_budget_id_here NODE_ENV=development npx github:securityvoid/ynab-mcp-server
  ```
- **Windows CMD:**
  ```cmd
  set YNAB_API_TOKEN=your_token_here && set YNAB_BUDGET_ID=your_budget_id_here && set NODE_ENV=development && npx github:securityvoid/ynab-mcp-server
  ```

---

### Client-Specific Notes

#### **Cline**
- **Recommended:** Use the `env` key in your MCP config (see above).
- **Alternative:** Set environment variables in your shell before launching Cline, or use a `.env` file if supported by your server.
- **Inline env with npx in config:** Not supported.

#### **Cursor**
- **Recommended:** Set environment variables in your shell before launching Cursor, or use a `.env` file in the server directory (if supported).
- **Inline env with npx in config:** Not supported. Cursor does **not** support the `env` key in the MCP config.
- **If you run the MCP server manually (not via Cursor config),** you can use inline env variables with `npx`.

#### **Claude Desktop**
- **Recommended:** Use the `env` key in your MCP config (see above).
- **Alternative:** Set environment variables in your shell before launching Claude Desktop, or use a `.env` file.
- **Inline env with npx in config:** Not supported.

#### **ChatGPT (MCP SuperAssistant)**
- **Recommended:** Use inline env variables with `npx` when running the server/proxy manually:
  ```bash
  YNAB_API_TOKEN=your_token_here npx github:securityvoid/ynab-mcp-server
  ```
- **Alternative:** Set environment variables in your shell before launching the proxy/server, or use a `.env` file.
- **Inline env with npx in config:** Supported when running manually.

---

## MCP Client Installation

This project supports integration with the most popular MCP clients. Follow the instructions below for your preferred environment. All examples use your forked version from GitHub (`github:securityvoid/ynab-mcp-server`).

### Cline

1. **Install Cline**: [Cline Download & Docs](https://docs.cline.bot/)
2. **Install the Cline VS Code Extension** (recommended for best experience)
3. **Add this MCP server**:
   - In the Cline MCP Marketplace (Extensions tab), search for and install `ynab-mcp-server`.
   - Or, add manually in your Cline MCP settings:
     ```json
     {
       "mcpServers": {
         "ynab-mcp-server": {
           "command": "npx",
           "args": ["github:securityvoid/ynab-mcp-server"]
         }
       }
     }
     ```
   - This ensures Cline uses your forked version from GitHub.
4. **Set your YNAB API token** in the MCP server config or as an environment variable.

### Cursor

1. **Install Cursor IDE**: [Cursor Download](https://www.cursor.so/)
2. **Install Node.js** (required for MCP servers): [Node.js Download](https://nodejs.org/)
3. **Configure Cursor to use your forked MCP server from GitHub:**
   - Open your Cursor MCP config file (`~/.cursor/mcp.json` on Mac/Linux, `%USERPROFILE%\.cursor\mcp.json` on Windows)
   - Add the following configuration:
     ```json
     {
       "mcpServers": {
         "ynab-mcp-server": {
           "command": "npx",
           "args": ["github:securityvoid/ynab-mcp-server"]
         }
       }
     }
     ```
   - This ensures Cursor will always use your forked version from GitHub (username: securityvoid).
4. **Restart Cursor** to apply changes.

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
           "args": ["github:securityvoid/ynab-mcp-server"]
         }
       }
     }
     ```
   - This ensures Claude Desktop uses your forked version from GitHub.
4. **Restart Claude Desktop.**

### ChatGPT (via MCP SuperAssistant)

1. **Install the MCP SuperAssistant Chrome Extension**: [Chrome Web Store](https://chrome.google.com/webstore/detail/mcp-superassistant/)
2. **Run the local proxy**:
   ```bash
   npx github:securityvoid/ynab-mcp-server --config ./mcpconfig.json
   ```
   - Or, if using the SuperAssistant proxy:
     ```bash
     npx @srbhptl39/mcp-superassistant-proxy@latest --config ./mcpconfig.json
     ```
   - Ensure your MCP config references your fork as shown above.
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
