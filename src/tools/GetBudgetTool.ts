import { MCPTool, logger } from "mcp-framework";
import { AxiosError } from "axios";
import * as ynab from "ynab";
import { z } from "zod";

interface GetBudgetInput {
  budget_id: string;
}

class GetBudgetTool extends MCPTool<GetBudgetInput> {
  name = "ynab_get_budget";
  description = "Gets detailed information about a specific budget including accounts and settings";

  schema = {
    budget_id: {
      type: z.string(),
      description: "The ID of the budget to fetch details for",
    },
  };

  api: ynab.API;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
  }

  async execute(input: GetBudgetInput) {
    try {
      logger.info(`Getting budget ${input.budget_id}`);
      const accountsResponse = await this.api.accounts.getAccounts(input.budget_id);
      const accountsData = accountsResponse.data.accounts
        .filter((account) => account.deleted === false && account.closed === false)
        .map((account) => ({
          id: account.id,
          name: account.name,
          type: account.type,
          on_budget: account.on_budget,
          balance: account.balance / 1000,
          cleared_balance: account.cleared_balance / 1000,
          uncleared_balance: account.uncleared_balance / 1000,
          debt_interest_rates: account.debt_interest_rates,
          debt_minimum_payments: account.debt_minimum_payments,
          debt_escrow_amounts: account.debt_escrow_amounts,
          debt_original_balance: account.debt_original_balance ? account.debt_original_balance / 1000 : null,
        }));

      const categoriesResponse = await this.api.categories.getCategories(input.budget_id);
      const categoriesData = categoriesResponse.data.category_groups
        .map((group) => group.categories)
        .flat()
        .filter((category) => category.deleted === false && category.hidden === false)
        .map((category) => ({
          id: category.id,
          category_group_name: category.category_group_name,
          name: category.name,
          budgeted: category.budgeted / 1000,
          activity: category.activity / 1000,
          balance: category.balance / 1000,
          goal_type: category.goal_type,
          goal_target: category.goal_target ? category.goal_target / 1000 : null,
          goal_percentage_complete: category.goal_percentage_complete,
        }));
      return {
        accounts: accountsData,
        categories: categoriesData,
      }
    } catch (error: unknown) {
      logger.error(`Error getting budget ${input.budget_id}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error getting budget ${input.budget_id}: ${JSON.stringify(error)}`;
    }
  }
}

export default GetBudgetTool;
