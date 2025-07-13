// GetBudgetSettingsTool.ts
//
// Tool for fetching budget settings by budget ID from the YNAB API.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface GetBudgetSettingsInput {
  budgetId: string;
}

class GetBudgetSettingsTool extends MCPTool<GetBudgetSettingsInput> {
  name = "get_budget_settings";
  description = "Fetches budget settings by budget ID from the YNAB API.";

  schema = {
    budgetId: {
      type: z.string() as unknown as z.ZodType<string>,
      description: "The ID of the budget to fetch settings for.",
    },
  };

  private api: ynab.API;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
  }

  async execute(input: GetBudgetSettingsInput) {
    if (!input.budgetId) {
      return "No budget ID provided.";
    }
    try {
      logger.info(`Fetching settings for budget ${input.budgetId}`);
      const resp = await this.api.budgets.getBudgetSettingsById(input.budgetId);
      return resp.data.settings;
    } catch (error) {
      logger.error(`Error fetching settings for budget ${input.budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error fetching budget settings: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default GetBudgetSettingsTool; 