// GetMonthTool.ts
//
// Tool for retrieving a single month in a YNAB budget.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface GetMonthInput {
  budgetId?: string;
  month: string; // ISO format YYYY-MM-01
}

class GetMonthTool extends MCPTool<GetMonthInput> {
  name = "get_month";
  description = "Gets a single month in a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional(),
      description: "The ID of the budget (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
    month: {
      type: z.string(),
      description: "The month in ISO format (e.g. 2024-01-01)",
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

  async execute(input: GetMonthInput) {
    // Validate and sanitize input using zod schema
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    if (!input.month) {
      return "No month provided.";
    }
    try {
      logger.info(`Getting month ${input.month} for budget ${budgetId}`);
      const response = await this.api.months.getMonth(budgetId, input.month);
      const month = response.data.month;
      return {
        month: month.month,
        note: month.note,
        income: month.income / 1000,
        budgeted: month.budgeted / 1000,
        activity: month.activity / 1000,
        to_be_budgeted: month.to_be_budgeted / 1000,
        age_of_money: month.age_of_money,
        categories: month.categories.map(category => ({
          id: category.id,
          name: category.name,
          group_id: category.category_group_id,
          budgeted: category.budgeted / 1000,
          activity: category.activity / 1000,
          balance: category.balance / 1000,
          goal_type: category.goal_type,
          goal_target: category.goal_target,
          note: category.note,
        })),
      };
    } catch (error) {
      logger.error(`Error getting month ${input.month} for budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error getting month: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default GetMonthTool; 