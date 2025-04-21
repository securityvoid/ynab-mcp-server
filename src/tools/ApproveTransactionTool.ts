import { MCPTool, logger } from "mcp-framework";
import { z } from "zod";
import * as ynab from "ynab";

interface UpdateTransactionInput {
  budgetId?: string;
  transactionId: string;
  approved?: boolean;
}

class ApproveTransactionTool extends MCPTool<UpdateTransactionInput> {
  name = "approve_transaction";
  description = "Approves an existing transaction in your YNAB budget.";

  private api: ynab.API;
  private budgetId: string;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
    this.budgetId = process.env.YNAB_BUDGET_ID || "";
  }

  schema = {
    budgetId: {
      type: z.string().optional(),
      description: "The id of the budget containing the transaction (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
    transactionId: {
      type: z.string(),
      description: "The id of the transaction to approve",
    },
    approved: {
      type: z.boolean().default(true),
      description: "Whether the transaction should be marked as approved",
    },
  };

  async execute(input: UpdateTransactionInput) {
    const budgetId = input.budgetId || this.budgetId;

    if (!budgetId) {
      throw new Error("No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable.");
    }

    try {
      // First, get the existing transaction to ensure we don't lose any data
      const existingTransaction = await this.api.transactions.getTransactionById(budgetId, input.transactionId);

      if (!existingTransaction.data.transaction) {
        throw new Error("Transaction not found");
      }

      const existingTransactionData = existingTransaction.data.transaction;

      const transaction: ynab.PutTransactionWrapper = {
        transaction: {
          approved: input.approved,
        }
      };

      const response = await this.api.transactions.updateTransaction(
        budgetId,
        existingTransactionData.id,
        transaction
      );

      if (!response.data.transaction) {
        throw new Error("Failed to update transaction - no transaction data returned");
      }

      return {
        success: true,
        transactionId: response.data.transaction.id,
        message: "Transaction updated successfully",
      };
    } catch (error) {
      logger.error(
        `Error getting unapproved transactions for budget ${budgetId}:`
      );
      logger.error(JSON.stringify(error, null, 2));
      return `Error getting unapproved transactions: ${
        error instanceof Error ? error.message : JSON.stringify(error)
      }`;
    }
  }
}

export default ApproveTransactionTool;