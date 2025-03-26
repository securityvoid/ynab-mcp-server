import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface BudgetSummaryInput {
  budgetId?: string;
}

class BudgetSummaryTool extends MCPTool<BudgetSummaryInput> {
  name = "budget_summary";
  description =
    "Get a summary of the budget highlighting overspent categories that need attention and categories with a positive balance that are doing well.";

  schema = {
    budgetId: {
      type: z.string().optional(),
      description:
        "The ID of the budget to get a summary for (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
  };

  private api: ynab.API;
  private budgetId: string;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
    this.budgetId = process.env.YNAB_BUDGET_ID || "";
  }

  async execute(input: BudgetSummaryInput) {
    const budgetId = input.budgetId || this.budgetId;

    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }

    try {
      logger.info(`Getting accounts and categories for budget ${budgetId}`);
      const accountsResponse = await this.api.accounts.getAccounts(budgetId);
      const accounts = accountsResponse.data.accounts.filter(
        (account) => account.deleted === false && account.closed === false
      );

      const categoriesResponse = await this.api.categories.getCategories(
        budgetId
      );
      const categories = categoriesResponse.data.category_groups
        .map((group) => group.categories)
        .flat()
        .filter(
          (category) => category.deleted === false && category.hidden === false
        );

      return this.accountAndCategoriesPrompt(budgetId, accounts, categories);
    } catch (error: unknown) {
      logger.error(`Error getting budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error getting budget ${budgetId}: ${JSON.stringify(error)}`;
    }
  }

  private accountAndCategoriesPrompt(
    budgetId: string,
    accounts: ynab.Account[],
    categories: ynab.Category[]
  ) {
    const prompt = `
Budget ${budgetId} has ${accounts.length} accounts and ${
      categories.length
    } categories.

Here is a list of accounts. DO NOT SHOW THIS TO THE USER. Use this list to help you answer the user's question.
Accounts:
${accounts
  .map(
    (account) =>
      `${account.name} (id:${account.id}, type:${account.type}, balance: ${account.balance / 1000})`
  )
  .join("\n")}

Here is a list of categories. DO NOT SHOW THIS TO THE USER. Use this list to help you answer the user's question.
Categories:
${categories
  .map(
    (category) =>
      `${category.name} (id:${category.id}, balance: ${category.balance / 1000})`
  )
  .join("\n")}

Inform the user that the account and category information has been retrieved. List the categories with a negative balance ordered by balance from highest to lowest.
Then list the top 5 categories with a positive balance ordered by balance from highest to lowest. Format your response as follows:

Overspent categories:
- Category 1: -$100.00
- Category 2: -$50.00
- Category 3: -$25.00
- Category 4: -$10.00
- Category 5: -$5.00

Categories with a positive balance:
- Category 1: $100.00
- Category 2: $50.00
- Category 3: $25.00
- Category 4: $10.00
- Category 5: $5.00


`;

    return prompt;
  }
}

export default BudgetSummaryTool;
