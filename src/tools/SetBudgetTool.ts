import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";
import Knowledge from "../knowledge.js";

class SetBudgetTool extends MCPTool {
  name = "ynab_set_budget";
  description =
    "Sets the default budget to use for all other tools. This tool also retrieves accounts and categories for the specified budget.";

  schema = {};

  api: ynab.API;
  knowledge: Knowledge;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
    this.knowledge = new Knowledge();
  }

  async execute() {
    const budgetId = this.knowledge.getDefaultBudgetId();
    if (!budgetId) {
      return "No default budget ID found. Please set a default budget ID first.";
    }

    const accounts = this.knowledge.getAccounts(budgetId);
    const categories = this.knowledge.getCategories(budgetId);

    if (!accounts || !categories) {
      try {
        logger.info(`Getting accounts and categories for budget ${budgetId}`);
        const accountsResponse = await this.api.accounts.getAccounts(
          budgetId
        );
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
            (category) =>
              category.deleted === false && category.hidden === false
          );

        this.knowledge.updateAccounts(budgetId, accounts);
        this.knowledge.updateCategories(budgetId, categories);

      } catch (error: unknown) {
        logger.error(`Error getting budget ${budgetId}:`);
        logger.error(JSON.stringify(error, null, 2));
        return `Error getting budget ${budgetId}: ${JSON.stringify(
          error
        )}`;
      }
    }

    return "Account and categories have been retrieved and saved. Ask the user what they want to do next.";
  }
}

export default SetBudgetTool;
