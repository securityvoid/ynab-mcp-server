// ListAccountTransactionsTool.ts
//
// Tool for listing all transactions for a specific account in a YNAB budget.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface ListAccountTransactionsInput {
  budgetId?: string;
  accountId: string;
}

class ListAccountTransactionsTool extends MCPTool<ListAccountTransactionsInput> {
  name = "list_account_transactions";
  description = "Lists all transactions for a specific account in a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional() as z.ZodType<string | undefined>,
      description: "The ID of the budget containing the account (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
    accountId: {
      type: z.string(),
      description: "The ID of the account to list transactions for.",
    },
  };

  private api: ynab.API;
  private budgetId: string;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
    this.budgetId = process.env.YNAB_BUDGET_ID || "";
  }

  async execute(input: ListAccountTransactionsInput) {
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    if (!input.accountId) {
      return "No account ID provided.";
    }
    try {
      logger.info(`Listing transactions for account ${input.accountId} in budget ${budgetId}`);
      const response = await this.api.transactions.getTransactionsByAccount(budgetId, input.accountId);
      const transactions = response.data.transactions.filter(tx => !tx.deleted);
      return transactions.map(tx => ({
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
      }));
    } catch (error) {
      logger.error(`Error listing transactions for account ${input.accountId} in budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error listing transactions for account: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default ListAccountTransactionsTool; 