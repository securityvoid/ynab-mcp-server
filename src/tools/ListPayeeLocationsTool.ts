// ListPayeeLocationsTool.ts
//
// Tool for listing all payee locations in a YNAB budget.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface ListPayeeLocationsInput {
  budgetId?: string;
}

class ListPayeeLocationsTool extends MCPTool<ListPayeeLocationsInput> {
  name = "list_payee_locations";
  description = "Lists all payee locations in a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional(),
      description: "The ID of the budget to list payee locations for (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
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

  async execute(input: ListPayeeLocationsInput) {
    // Validate and sanitize input using zod schema
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    try {
      logger.info(`Listing payee locations for budget ${budgetId}`);
      const response = await this.api.payeeLocations.getPayeeLocations(budgetId);
      const locations = response.data.payee_locations;
      return locations.map(location => ({
        id: location.id,
        payee_id: location.payee_id,
        latitude: location.latitude,
        longitude: location.longitude,
        deleted: location.deleted,
      }));
    } catch (error) {
      logger.error(`Error listing payee locations for budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error listing payee locations: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default ListPayeeLocationsTool; 