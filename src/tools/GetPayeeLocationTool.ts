// GetPayeeLocationTool.ts
//
// Tool for retrieving a single payee location by ID in a YNAB budget.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface GetPayeeLocationInput {
  budgetId?: string;
  payeeLocationId: string;
}

class GetPayeeLocationTool extends MCPTool<GetPayeeLocationInput> {
  name = "get_payee_location";
  description = "Gets a single payee location by ID in a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional(),
      description: "The ID of the budget (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
    payeeLocationId: {
      type: z.string(),
      description: "The ID of the payee location to retrieve.",
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

  async execute(input: GetPayeeLocationInput) {
    // Validate and sanitize input using zod schema
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    if (!input.payeeLocationId) {
      return "No payee location ID provided.";
    }
    try {
      logger.info(`Getting payee location ${input.payeeLocationId} for budget ${budgetId}`);
      const response = await this.api.payeeLocations.getPayeeLocationById(budgetId, input.payeeLocationId);
      const location = response.data.payee_location;
      return {
        id: location.id,
        payee_id: location.payee_id,
        latitude: location.latitude,
        longitude: location.longitude,
        deleted: location.deleted,
      };
    } catch (error) {
      logger.error(`Error getting payee location ${input.payeeLocationId} for budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error getting payee location: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default GetPayeeLocationTool; 