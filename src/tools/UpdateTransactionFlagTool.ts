// UpdateTransactionFlagTool.ts
//
// Tool for updating the flag of a transaction using the YNAB API.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface UpdateTransactionFlagInput {
  budgetId: string;
  transactionId: string;
  flag_name: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | null;
}

class UpdateTransactionFlagTool extends MCPTool<UpdateTransactionFlagInput> {
  name = "update_transaction_flag";
  description = "Updates the flag of a transaction using the YNAB API.";

  schema = {
    budgetId: {
      type: z.string() as unknown as z.ZodType<string>,
      description: "The ID of the budget containing the transaction.",
    },
    transactionId: {
      type: z.string() as unknown as z.ZodType<string>,
      description: "The ID of the transaction to update.",
    },
    flag_name: {
      type: z.enum(['red', 'orange', 'yellow', 'green', 'blue', 'purple']).nullable() as unknown as z.ZodType<'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | null>,
      description: "The new flag color for the transaction (or null to clear).",
    },
  };

  private api: ynab.API;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
  }

  async execute(input: UpdateTransactionFlagInput) {
    if (!input.budgetId) {
      return "No budget ID provided.";
    }
    if (!input.transactionId) {
      return "No transaction ID provided.";
    }
    try {
      logger.info(`Updating flag for transaction ${input.transactionId} in budget ${input.budgetId}`);
      const patch = { transaction: { flag_color: input.flag_name } };
      const resp = await this.api.transactions.updateTransaction(input.budgetId, input.transactionId, patch);
      return resp.data.transaction;
    } catch (error) {
      logger.error(`Error updating flag for transaction ${input.transactionId} in budget ${input.budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error updating transaction flag: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default UpdateTransactionFlagTool; 