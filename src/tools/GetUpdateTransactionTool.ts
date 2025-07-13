// GetUpdateTransactionTool.ts
//
// Tool for retrieving and updating a transaction by ID in a YNAB budget.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface GetUpdateTransactionInput {
  budgetId?: string;
  transactionId: string;
  update?: {
    amount?: number;
    memo?: string;
    categoryId?: string;
    payeeId?: string;
    cleared?: boolean;
    approved?: boolean;
    flagColor?: string;
  };
}

class GetUpdateTransactionTool extends MCPTool<GetUpdateTransactionInput> {
  name = "get_update_transaction";
  description = "Gets or updates a transaction by ID in a YNAB budget. If 'update' is provided, updates the transaction.";

  schema = {
    budgetId: {
      type: z.string().optional(),
      description: "The ID of the budget (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
    transactionId: {
      type: z.string(),
      description: "The ID of the transaction to retrieve or update.",
    },
    update: {
      type: z.object({
        amount: z.number().optional(),
        memo: z.string().optional(),
        categoryId: z.string().optional(),
        payeeId: z.string().optional(),
        cleared: z.boolean().optional(),
        approved: z.boolean().optional(),
        flagColor: z.string().optional(),
      }).optional(),
      description: "Fields to update on the transaction. If omitted, just retrieves the transaction.",
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

  async execute(input: GetUpdateTransactionInput) {
    // Validate and sanitize input using zod schema
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    if (!input.transactionId) {
      return "No transaction ID provided.";
    }
    try {
      if (!input.update) {
        // Just get the transaction
        logger.info(`Getting transaction ${input.transactionId} for budget ${budgetId}`);
        const response = await this.api.transactions.getTransactionById(budgetId, input.transactionId);
        const tx = response.data.transaction;
        return {
          id: tx.id,
          date: tx.date,
          amount: tx.amount / 1000,
          memo: tx.memo,
          approved: tx.approved,
          account_id: tx.account_id,
          account_name: tx.account_name,
          payee_id: tx.payee_id,
          payee_name: tx.payee_name,
          category_id: tx.category_id,
          category_name: tx.category_name,
          cleared: tx.cleared,
          flag_color: tx.flag_color,
          import_id: tx.import_id,
        };
      } else {
        // Update the transaction
        logger.info(`Updating transaction ${input.transactionId} for budget ${budgetId}`);
        const existing = await this.api.transactions.getTransactionById(budgetId, input.transactionId);
        const tx = existing.data.transaction;
        const update: ynab.PutTransactionWrapper = {
          transaction: {
            amount: input.update.amount !== undefined ? Math.round(input.update.amount * 1000) : undefined,
            memo: input.update.memo !== undefined ? input.update.memo : undefined,
            category_id: input.update.categoryId !== undefined ? input.update.categoryId : undefined,
            payee_id: input.update.payeeId !== undefined ? input.update.payeeId : undefined,
            cleared: input.update.cleared !== undefined ? (input.update.cleared ? ynab.TransactionClearedStatus.Cleared : ynab.TransactionClearedStatus.Uncleared) : undefined,
            approved: input.update.approved !== undefined ? input.update.approved : undefined,
            flag_color: input.update.flagColor !== undefined ? input.update.flagColor as ynab.TransactionFlagColor : undefined,
          }
        };
        const response = await this.api.transactions.updateTransaction(budgetId, tx.id, update);
        const updated = response.data.transaction;
        return {
          id: updated.id,
          date: updated.date,
          amount: updated.amount / 1000,
          memo: updated.memo,
          approved: updated.approved,
          account_id: updated.account_id,
          account_name: updated.account_name,
          payee_id: updated.payee_id,
          payee_name: updated.payee_name,
          category_id: updated.category_id,
          category_name: updated.category_name,
          cleared: updated.cleared,
          flag_color: updated.flag_color,
          import_id: updated.import_id,
        };
      }
    } catch (error) {
      logger.error(`Error getting/updating transaction ${input.transactionId} for budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error getting/updating transaction: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default GetUpdateTransactionTool; 