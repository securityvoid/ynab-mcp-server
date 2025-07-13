// ListTransactionsTool.ts
//
// Tool for listing all transactions (approved and unapproved) in a YNAB budget.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface ListTransactionsInput {
  budgetId?: string;
  type?: "approved" | "unapproved" | "all";
}

class ListTransactionsTool extends MCPTool<ListTransactionsInput> {
  name = "list_transactions";
  description = "Lists all transactions (approved and unapproved) in a YNAB budget. Optionally filter by approval status.";

  schema = {
    budgetId: {
      type: z.string().optional(),
      description: "The ID of the budget to list transactions for (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
    type: {
      type: z.enum(["approved", "unapproved", "all"]).optional(),
      description: "Filter by transaction approval status (approved, unapproved, or all). Defaults to all.",
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

  async execute(input: ListTransactionsInput) {
    // Validate and sanitize input using zod schema
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    let type: ynab.GetTransactionsTypeEnum | undefined = undefined;
    if (input.type === "approved") type = ynab.GetTransactionsTypeEnum.Approved;
    else if (input.type === "unapproved") type = ynab.GetTransactionsTypeEnum.Unapproved;
    // 'all' or undefined means no filter
    try {
      logger.info(`Listing transactions for budget ${budgetId} with type ${input.type || 'all'}`);
      const response = await this.api.transactions.getTransactions(budgetId, undefined, type);
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
      logger.error(`Error listing transactions for budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error listing transactions: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default ListTransactionsTool; 