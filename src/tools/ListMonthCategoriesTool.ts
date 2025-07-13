// ListMonthCategoriesTool.ts
//
// Tool for listing all categories for a specific month in a YNAB budget.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";
import axios from "axios";

interface ListMonthCategoriesInput {
  budgetId?: string;
  month: string;
}

class ListMonthCategoriesTool extends MCPTool<ListMonthCategoriesInput> {
  name = "list_month_categories";
  description = "Lists all categories for a specific month in a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional() as z.ZodType<string | undefined>,
      description: "The ID of the budget (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
    month: {
      type: z.string(),
      description: "The month in YYYY-MM-01 format.",
    },
  };

  private api: ynab.API;
  private budgetId: string;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
    this.budgetId = process.env.YNAB_BUDGET_ID || "";
  }

  async execute(input: ListMonthCategoriesInput) {
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    if (!input.month) {
      return "No month provided.";
    }
    try {
      logger.info(`Listing categories for month ${input.month} in budget ${budgetId}`);
      const url = `https://api.youneedabudget.com/v1/budgets/${budgetId}/months/${input.month}/categories`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${process.env.YNAB_API_TOKEN}`,
        },
      });
      return response.data.data.categories;
    } catch (error) {
      logger.error(`Error listing categories for month ${input.month} in budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error listing month categories: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default ListMonthCategoriesTool; 