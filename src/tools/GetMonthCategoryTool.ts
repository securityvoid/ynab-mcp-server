// GetMonthCategoryTool.ts
//
// Tool for fetching a category for a specific month in a YNAB budget.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface GetMonthCategoryInput {
  budgetId?: string;
  month: string;
  categoryId: string;
}

class GetMonthCategoryTool extends MCPTool<GetMonthCategoryInput> {
  name = "get_month_category";
  description = "Gets a category's details for a specific month in a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional() as z.ZodType<string | undefined>,
      description: "The ID of the budget (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
    month: {
      type: z.string(),
      description: "The month in YYYY-MM-01 format.",
    },
    categoryId: {
      type: z.string(),
      description: "The ID of the category to fetch.",
    },
  };

  private api: ynab.API;
  private budgetId: string;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
    this.budgetId = process.env.YNAB_BUDGET_ID || "";
  }

  async execute(input: GetMonthCategoryInput) {
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    if (!input.month) {
      return "No month provided.";
    }
    if (!input.categoryId) {
      return "No category ID provided.";
    }
    try {
      logger.info(`Getting category ${input.categoryId} for month ${input.month} in budget ${budgetId}`);
      const response = await this.api.categories.getMonthCategoryById(budgetId, input.month, input.categoryId);
      return response.data.category;
    } catch (error) {
      logger.error(`Error getting category ${input.categoryId} for month ${input.month} in budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error getting month category: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default GetMonthCategoryTool; 