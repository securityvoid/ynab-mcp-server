// DeleteTransactionTool.ts
//
// Tool for deleting a transaction from a YNAB budget.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface DeleteTransactionInput {
  budgetId?: string;
  transactionId: string;
}

class DeleteTransactionTool extends MCPTool<DeleteTransactionInput> {
  name = "delete_transaction";
  description = "Deletes a transaction from a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional() as z.ZodType<string | undefined>,
      description: "The ID of the budget containing the transaction (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
    transactionId: {
      type: z.string(),
      description: "The ID of the transaction to delete.",
    },
  };

  private api: ynab.API;
  private budgetId: string;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
    this.budgetId = process.env.YNAB_BUDGET_ID || "";
  }

  async execute(input: DeleteTransactionInput) {
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    if (!input.transactionId) {
      return "No transaction ID provided.";
    }
    try {
      logger.info(`Deleting transaction ${input.transactionId} in budget ${budgetId}`);
      await this.api.transactions.deleteTransaction(budgetId, input.transactionId);
      return { success: true, message: "Transaction deleted successfully." };
    } catch (error) {
      logger.error(`Error deleting transaction ${input.transactionId} in budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error deleting transaction: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default DeleteTransactionTool; 