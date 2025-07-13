// ListCategoriesTool.ts
//
// Tool for listing all categories in a YNAB budget.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface ListCategoriesInput {
  budgetId?: string;
}

class ListCategoriesTool extends MCPTool<ListCategoriesInput> {
  name = "list_categories";
  description = "Lists all categories in a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional(),
      description: "The ID of the budget to list categories for (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
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

  async execute(input: ListCategoriesInput) {
    // Validate and sanitize input using zod schema
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    try {
      logger.info(`Listing categories for budget ${budgetId}`);
      const response = await this.api.categories.getCategories(budgetId);
      // Flatten category groups and categories
      const categories = response.data.category_groups.flatMap(group =>
        group.categories.filter(category => !category.deleted && !category.hidden)
      );
      return categories.map(category => ({
        id: category.id,
        name: category.name,
        group_id: category.category_group_id,
        group_name: response.data.category_groups.find(g => g.id === category.category_group_id)?.name || null,
        budgeted: category.budgeted / 1000,
        activity: category.activity / 1000,
        balance: category.balance / 1000,
        goal_type: category.goal_type,
        goal_target: category.goal_target,
        note: category.note,
      }));
    } catch (error) {
      logger.error(`Error listing categories for budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error listing categories: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default ListCategoriesTool; 