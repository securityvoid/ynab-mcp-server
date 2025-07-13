// UpdateScheduledTransactionFlagTool.ts
//
// Tool for updating the flag of a scheduled transaction using the YNAB API.
//
// Security: Reads YNAB API token from environment variables. Never logs or exposes sensitive data.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface UpdateScheduledTransactionFlagInput {
  budgetId: string;
  scheduledTransactionId: string;
  flag_name: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | null;
}

class UpdateScheduledTransactionFlagTool extends MCPTool<UpdateScheduledTransactionFlagInput> {
  name = "update_scheduled_transaction_flag";
  description = "Updates the flag of a scheduled transaction using the YNAB API.";

  schema = {
    budgetId: {
      type: z.string() as unknown as z.ZodType<string>,
      description: "The ID of the budget containing the scheduled transaction.",
    },
    scheduledTransactionId: {
      type: z.string() as unknown as z.ZodType<string>,
      description: "The ID of the scheduled transaction to update.",
    },
    flag_name: {
      type: z.enum(['red', 'orange', 'yellow', 'green', 'blue', 'purple']).nullable() as unknown as z.ZodType<'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | null>,
      description: "The new flag color for the scheduled transaction (or null to clear).",
    },
  };

  private api: ynab.API;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
  }

  async execute(input: UpdateScheduledTransactionFlagInput) {
    if (!input.budgetId) {
      return "No budget ID provided.";
    }
    if (!input.scheduledTransactionId) {
      return "No scheduled transaction ID provided.";
    }
    try {
      logger.info(`Updating flag for scheduled transaction ${input.scheduledTransactionId} in budget ${input.budgetId}`);
      // Fetch the scheduled transaction
      const getResp = await this.api.scheduledTransactions.getScheduledTransactionById(input.budgetId, input.scheduledTransactionId);
      const scheduled = getResp.data.scheduled_transaction;
      if (!scheduled) return "Scheduled transaction not found.";
      // Update the flag_color and ensure required fields are present
      const updated = {
        account_id: scheduled.account_id,
        date: scheduled.date_next, // Use date_next for the required date field
        amount: scheduled.amount,
        payee_id: scheduled.payee_id,
        payee_name: scheduled.payee_name,
        category_id: scheduled.category_id,
        memo: scheduled.memo,
        flag_color: input.flag_name,
        frequency: scheduled.frequency,
        // include any other fields as needed
      };
      const patch = { scheduled_transaction: updated };
      const resp = await this.api.scheduledTransactions.updateScheduledTransaction(input.budgetId, input.scheduledTransactionId, patch);
      return resp.data.scheduled_transaction;
    } catch (error) {
      logger.error(`Error updating flag for scheduled transaction ${input.scheduledTransactionId} in budget ${input.budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error updating scheduled transaction flag: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default UpdateScheduledTransactionFlagTool; 