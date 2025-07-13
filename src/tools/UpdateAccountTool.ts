// UpdateAccountTool.ts
//
// Tool for updating the name of an account in a YNAB budget.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface UpdateAccountInput {
  budgetId?: string;
  accountId: string;
  name: string;
}

class UpdateAccountTool extends MCPTool<UpdateAccountInput> {
  name = "update_account";
  description = "Updates the name of an account in a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional() as z.ZodType<string | undefined>,
      description: "The ID of the budget containing the account (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
    accountId: {
      type: z.string(),
      description: "The ID of the account to update.",
    },
    name: {
      type: z.string(),
      description: "The new name for the account.",
    },
  };

  private api: ynab.API;
  private budgetId: string;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
    this.budgetId = process.env.YNAB_BUDGET_ID || "";
  }

  async execute(input: UpdateAccountInput) {
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    if (!input.accountId) {
      return "No account ID provided.";
    }
    if (!input.name) {
      return "No account name provided.";
    }
    try {
      logger.info(`Updating account ${input.accountId} in budget ${budgetId}`);
      const updateObj: ynab.SaveAccountWrapper = {
        account: {
          name: input.name,
        },
      };
      const response = await this.api.accounts.updateAccount(budgetId, input.accountId, updateObj);
      return response.data.account;
    } catch (error) {
      logger.error(`Error updating account ${input.accountId} in budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error updating account: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default UpdateAccountTool; 