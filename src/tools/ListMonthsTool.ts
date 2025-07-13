// ListMonthsTool.ts
//
// Tool for listing all months in a YNAB budget.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface ListMonthsInput {
  budgetId?: string;
}

class ListMonthsTool extends MCPTool<ListMonthsInput> {
  name = "list_months";
  description = "Lists all months in a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional(),
      description: "The ID of the budget to list months for (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
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

  async execute(input: ListMonthsInput) {
    // Validate and sanitize input using zod schema
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    try {
      logger.info(`Listing months for budget ${budgetId}`);
      const response = await this.api.months.getMonths(budgetId);
      const months = response.data.months;
      return months.map(month => ({
        month: month.month,
        note: month.note,
        income: month.income / 1000,
        budgeted: month.budgeted / 1000,
        activity: month.activity / 1000,
        to_be_budgeted: month.to_be_budgeted / 1000,
        age_of_money: month.age_of_money,
      }));
    } catch (error) {
      logger.error(`Error listing months for budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error listing months: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default ListMonthsTool; 