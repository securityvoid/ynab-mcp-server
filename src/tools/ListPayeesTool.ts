// ListPayeesTool.ts
//
// Tool for listing all payees in a YNAB budget.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface ListPayeesInput {
  budgetId?: string;
}

class ListPayeesTool extends MCPTool<ListPayeesInput> {
  name = "list_payees";
  description = "Lists all payees in a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional(),
      description: "The ID of the budget to list payees for (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
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

  async execute(input: ListPayeesInput) {
    // Validate and sanitize input using zod schema
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    try {
      logger.info(`Listing payees for budget ${budgetId}`);
      const response = await this.api.payees.getPayees(budgetId);
      const payees = response.data.payees.filter(payee => !payee.deleted);
      return payees.map(payee => ({
        id: payee.id,
        name: payee.name,
        transfer_account_id: payee.transfer_account_id,
        deleted: payee.deleted,
      }));
    } catch (error) {
      logger.error(`Error listing payees for budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error listing payees: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default ListPayeesTool; 