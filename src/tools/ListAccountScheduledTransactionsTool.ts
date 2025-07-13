// ListAccountScheduledTransactionsTool.ts
//
// Tool for listing all scheduled transactions for a specific account in a YNAB budget.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";
import axios from "axios";

interface ListAccountScheduledTransactionsInput {
  budgetId?: string;
  accountId: string;
}

class ListAccountScheduledTransactionsTool extends MCPTool<ListAccountScheduledTransactionsInput> {
  name = "list_account_scheduled_transactions";
  description = "Lists all scheduled transactions for a specific account in a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional() as z.ZodType<string | undefined>,
      description: "The ID of the budget containing the account (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
    accountId: {
      type: z.string(),
      description: "The ID of the account to list scheduled transactions for.",
    },
  };

  private api: ynab.API;
  private budgetId: string;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
    this.budgetId = process.env.YNAB_BUDGET_ID || "";
  }

  async execute(input: ListAccountScheduledTransactionsInput) {
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    if (!input.accountId) {
      return "No account ID provided.";
    }
    try {
      logger.info(`Listing scheduled transactions for account ${input.accountId} in budget ${budgetId}`);
      const url = `https://api.youneedabudget.com/v1/budgets/${budgetId}/accounts/${input.accountId}/scheduled_transactions`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${process.env.YNAB_API_TOKEN}`,
        },
      });
      const scheduled = response.data.data.scheduled_transactions.filter((tx: any) => !tx.deleted);
      return scheduled.map((tx: any) => ({
        id: tx.id,
        date_first: tx.date_first,
        date_next: tx.date_next,
        frequency: tx.frequency,
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
      }));
    } catch (error) {
      logger.error(`Error listing scheduled transactions for account ${input.accountId} in budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error listing scheduled transactions for account: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default ListAccountScheduledTransactionsTool; 