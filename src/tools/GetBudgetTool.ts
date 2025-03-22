import { MCPTool } from "mcp-framework";
import { logger } from "mcp-framework";
import { AxiosError } from "axios";
import { api } from "../ynab";
import { z } from "zod";

interface BudgetDetail {
  id: string;
  name: string;
  last_modified_on: string;
  first_month: string;
  last_month: string;
  currency_format: {
    iso_code: string;
    example_format: string;
    decimal_digits: number;
    decimal_separator: string;
    symbol_first: boolean;
    group_separator: string;
    currency_symbol: string;
    display_symbol: boolean;
  };
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    cleared_balance: number;
    uncleared_balance: number;
    closed: boolean;
  }>;
}

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

  async execute(input: GetBudgetInput) {
    try {
      logger.info(`Getting budget ${input.budget_id}`);
      const response = await api.budgets.getBudgetById(input.budget_id);
      return response.data.budget;
    } catch (error: unknown) {
      logger.error(`Error getting budget ${input.budget_id}: ${error}`);
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

export default GetBudgetTool;
