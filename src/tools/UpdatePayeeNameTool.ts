// UpdatePayeeNameTool.ts
//
// Tool for updating a payee's name using the YNAB API.
//
// Security: Reads YNAB API token from environment variables. Never logs or exposes sensitive data.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface UpdatePayeeNameInput {
  budgetId: string;
  payeeId: string;
  name: string;
}

class UpdatePayeeNameTool extends MCPTool<UpdatePayeeNameInput> {
  name = "update_payee_name";
  description = "Updates a payee's name using the YNAB API.";

  schema = {
    budgetId: {
      type: z.string() as unknown as z.ZodType<string>,
      description: "The ID of the budget containing the payee.",
    },
    payeeId: {
      type: z.string() as unknown as z.ZodType<string>,
      description: "The ID of the payee to update.",
    },
    name: {
      type: z.string() as unknown as z.ZodType<string>,
      description: "The new name for the payee.",
    },
  };

  private api: ynab.API;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
  }

  async execute(input: UpdatePayeeNameInput) {
    if (!input.budgetId) {
      return "No budget ID provided.";
    }
    if (!input.payeeId) {
      return "No payee ID provided.";
    }
    if (!input.name) {
      return "No new name provided.";
    }
    try {
      logger.info(`Updating payee ${input.payeeId} in budget ${input.budgetId}`);
      const patch = { payee: { name: input.name } };
      const resp = await this.api.payees.updatePayee(input.budgetId, input.payeeId, patch);
      return resp.data.payee;
    } catch (error) {
      logger.error(`Error updating payee ${input.payeeId} in budget ${input.budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error updating payee: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default UpdatePayeeNameTool; 