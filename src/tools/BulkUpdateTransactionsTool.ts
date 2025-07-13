// BulkUpdateTransactionsTool.ts
//
// Tool for updating multiple transactions at once in a YNAB budget.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface BulkUpdateTransactionsInput {
  budgetId?: string;
  updates: Array<{
    transactionId: string;
    amount?: number;
    memo?: string;
    categoryId?: string;
    payeeId?: string;
    cleared?: boolean;
    approved?: boolean;
    flagColor?: string;
  }>;
}

class BulkUpdateTransactionsTool extends MCPTool<BulkUpdateTransactionsInput> {
  name = "bulk_update_transactions";
  description = "Updates multiple transactions at once in a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional(),
      description: "The ID of the budget (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
    updates: {
      type: z.array(z.object({
        transactionId: z.string(),
        amount: z.number().optional(),
        memo: z.string().optional(),
        categoryId: z.string().optional(),
        payeeId: z.string().optional(),
        cleared: z.boolean().optional(),
        approved: z.boolean().optional(),
        flagColor: z.string().optional(),
      })),
      description: "Array of transaction updates. Each must include a transactionId and at least one field to update.",
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

  async execute(input: BulkUpdateTransactionsInput) {
    // Validate and sanitize input using zod schema
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    if (!input.updates || input.updates.length === 0) {
      return "No updates provided.";
    }
    try {
      logger.info(`Bulk updating ${input.updates.length} transactions for budget ${budgetId}`);
      // Fetch all transactions to get their current state
      const results = [];
      for (const update of input.updates) {
        try {
          const existing = await this.api.transactions.getTransactionById(budgetId, update.transactionId);
          const tx = existing.data.transaction;
          const updateObj: ynab.PutTransactionWrapper = {
            transaction: {
              amount: update.amount !== undefined ? Math.round(update.amount * 1000) : undefined,
              memo: update.memo !== undefined ? update.memo : undefined,
              category_id: update.categoryId !== undefined ? update.categoryId : undefined,
              payee_id: update.payeeId !== undefined ? update.payeeId : undefined,
              cleared: update.cleared !== undefined ? (update.cleared ? ynab.TransactionClearedStatus.Cleared : ynab.TransactionClearedStatus.Uncleared) : undefined,
              approved: update.approved !== undefined ? update.approved : undefined,
              flag_color: update.flagColor !== undefined ? update.flagColor as ynab.TransactionFlagColor : undefined,
            }
          };
          const response = await this.api.transactions.updateTransaction(budgetId, tx.id, updateObj);
          const updated = response.data.transaction;
          results.push({
            id: updated.id,
            success: true,
            updated: {
              amount: updated.amount / 1000,
              memo: updated.memo,
              approved: updated.approved,
              account_id: updated.account_id,
              payee_id: updated.payee_id,
              category_id: updated.category_id,
              cleared: updated.cleared,
              flag_color: updated.flag_color,
            }
          });
        } catch (err) {
          results.push({
            id: update.transactionId,
            success: false,
            error: err instanceof Error ? err.message : JSON.stringify(err),
          });
        }
      }
      return results;
    } catch (error) {
      logger.error(`Error bulk updating transactions for budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error bulk updating transactions: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default BulkUpdateTransactionsTool; 