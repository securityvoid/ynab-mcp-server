import { MCPTool, logger } from "mcp-framework";
import { AxiosError } from "axios";
import * as ynab from "ynab";

class ListBudgetsTool extends MCPTool {
  name = "ynab_list_budgets";
  description = "Lists all available budgets from YNAB API";

  schema = {};

  api: ynab.API;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
  }

  async execute() {
    try {
      logger.info("Listing budgets");
      const budgetsResponse = await this.api.budgets.getBudgets();
      logger.info(`Found ${budgetsResponse.data.budgets.length} budgets`);

      const budgets = budgetsResponse.data.budgets.map((budget) => ({
        id: budget.id,
        name: budget.name,
      }));

      return budgets.join("\n\n");
    } catch (error: unknown) {
      logger.error(`Error listing budgets: ${JSON.stringify(error)}`);
      if (error instanceof AxiosError) {
        throw new Error(
          `YNAB API Error: ${
            error.response?.data?.error?.detail || error.message
          }`
        );
      } else {
        throw new Error(`Unknown error: ${error}`);
      }
    }
  }
}

export default ListBudgetsTool;
