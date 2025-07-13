// GetPayeeTool.ts
//
// Tool for fetching a payee by ID from the YNAB API.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface GetPayeeInput {
  budgetId?: string;
  payeeId: string;
}

class GetPayeeTool extends MCPTool<GetPayeeInput> {
  name = "get_payee";
  description = "Gets a single payee by ID in a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional(),
      description: "The ID of the budget (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
    payeeId: {
      type: z.string(),
      description: "The ID of the payee to retrieve.",
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

  async execute(input: GetPayeeInput) {
    // Validate and sanitize input using zod schema
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    if (!input.payeeId) {
      return "No payee ID provided.";
    }
    try {
      logger.info(`Getting payee ${input.payeeId} for budget ${budgetId}`);
      const response = await this.api.payees.getPayeeById(budgetId, input.payeeId);
      const payee = response.data.payee;
      return {
        id: payee.id,
        name: payee.name,
        transfer_account_id: payee.transfer_account_id,
        deleted: payee.deleted,
      };
    } catch (error) {
      logger.error(`Error getting payee ${input.payeeId} for budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error getting payee: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default GetPayeeTool; 