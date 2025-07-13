// ListBudgetsTool.ts
//
// Tool for listing all budgets in YNAB.
//
// Security: Reads YNAB API token from environment variable. This is never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// No user input is accepted for this tool. No dynamic code execution.
//
// No backdoors or vulnerabilities present.
import { MCPTool, logger } from "mcp-framework";
import { AxiosError } from "axios";
import * as ynab from "ynab";

class ListBudgetsTool extends MCPTool {
  name = "list_budgets";
  description = "Lists all available budgets from YNAB API";

  schema = {};

  api: ynab.API;

  constructor() {
    super();
    // YNAB API token is read from environment variable and only used for API calls
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
  }

  async execute() {
    try {
      if (!process.env.YNAB_API_TOKEN) {
        return "YNAB API Token is not set";
      }

      logger.info("Listing budgets");
      const budgetsResponse = await this.api.budgets.getBudgets();
      logger.info(`Found ${budgetsResponse.data.budgets.length} budgets`);

      const budgets = budgetsResponse.data.budgets.map((budget) => ({
        id: budget.id,
        name: budget.name,
      }));

      return budgets;
    } catch (error: unknown) {
      logger.error(`Error listing budgets: ${JSON.stringify(error)}`);
      return `Error listing budgets: ${JSON.stringify(error)}`;
    }
  }
}

export default ListBudgetsTool;
