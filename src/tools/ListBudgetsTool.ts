import { MCPTool } from "mcp-framework";
import { AxiosError } from "axios";
import { api } from "../ynab";

interface Budget {
  id: string;
  name: string;
  last_modified_on: string;
  first_month: string;
  last_month: string;
}

interface BudgetsResponse {
  data: {
    budgets: Budget[];
  };
}


class ListBudgetsTool extends MCPTool {
  name = "ynab_list_budgets";
  description = "Lists all available budgets from YNAB API";

  schema = {};

  async execute() {
    try {
      const budgetsResponse = await api.budgets.getBudgets();

      return budgetsResponse.data.budgets;
    } catch (error: unknown) {
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
