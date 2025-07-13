// GetBudgetTool.ts
//
// Tool for fetching a single budget by ID from the YNAB API.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface GetBudgetInput {
  budgetId: string;
}

class GetBudgetTool extends MCPTool<GetBudgetInput> {
  name = "get_budget";
  description = "Fetches a single budget by ID from the YNAB API.";

  schema = {
    budgetId: {
      type: z.string() as unknown as z.ZodType<string>,
      description: "The ID of the budget to fetch.",
    },
  };

  private api: ynab.API;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
  }

  async execute(input: GetBudgetInput) {
    if (!input.budgetId) {
      return "No budget ID provided.";
    }
    try {
      logger.info(`Fetching budget ${input.budgetId}`);
      const resp = await this.api.budgets.getBudgetById(input.budgetId);
      return resp.data.budget;
    } catch (error) {
      logger.error(`Error fetching budget ${input.budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error fetching budget: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default GetBudgetTool; 