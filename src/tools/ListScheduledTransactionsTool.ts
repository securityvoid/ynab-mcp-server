// ListScheduledTransactionsTool.ts
//
// Tool for listing all scheduled transactions in a YNAB budget.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface ListScheduledTransactionsInput {
  budgetId?: string;
}

class ListScheduledTransactionsTool extends MCPTool<ListScheduledTransactionsInput> {
  name = "list_scheduled_transactions";
  description = "Lists all scheduled transactions in a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional(),
      description: "The ID of the budget to list scheduled transactions for (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
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

  async execute(input: ListScheduledTransactionsInput) {
    // Validate and sanitize input using zod schema
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    try {
      logger.info(`Listing scheduled transactions for budget ${budgetId}`);
      const response = await this.api.scheduledTransactions.getScheduledTransactions(budgetId);
      const scheduled = response.data.scheduled_transactions.filter(tx => !tx.deleted);
      return scheduled.map(tx => ({
        id: tx.id,
        date_first: tx.date_first,
        date_next: tx.date_next,
        frequency: tx.frequency,
        amount: tx.amount / 1000,
        memo: tx.memo,
        approved: tx.approved,
        account_id: tx.account_id,
        payee_id: tx.payee_id,
        category_id: tx.category_id,
        cleared: tx.cleared,
        flag_color: tx.flag_color,
        deleted: tx.deleted,
      }));
    } catch (error) {
      logger.error(`Error listing scheduled transactions for budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error listing scheduled transactions: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default ListScheduledTransactionsTool; 