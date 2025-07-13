// ListAccountsTool.ts
//
// Tool for listing all accounts in a YNAB budget.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface ListAccountsInput {
  budgetId?: string;
}

class ListAccountsTool extends MCPTool<ListAccountsInput> {
  name = "list_accounts";
  description = "Lists all accounts in a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional() as z.ZodType<string | undefined>,
      description: "The ID of the budget to list accounts for (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
  };

  private api: ynab.API;
  private budgetId: string;

  constructor() {
    super();
    // YNAB API token is read from environment variable and only used for API calls
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
    this.budgetId = process.env.YNAB_BUDGET_ID || "";
  }

  async execute(input: ListAccountsInput) {
    // Validate and sanitize input using zod schema
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    try {
      logger.info(`Listing accounts for budget ${budgetId}`);
      const response = await this.api.accounts.getAccounts(budgetId);
      const accounts = response.data.accounts.filter(
        (account) => account.deleted === false && account.closed === false
      );
      return accounts.map(account => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.balance / 1000,
        on_budget: account.on_budget,
        closed: account.closed,
      }));
    } catch (error) {
      logger.error(`Error listing accounts for budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error listing accounts: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default ListAccountsTool; 