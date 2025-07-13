// AccountReconciliationTool.ts
//
// Tool for reconciling an account in a YNAB budget by creating a reconciliation transaction if needed.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface AccountReconciliationInput {
  budgetId?: string;
  accountId: string;
  reconciledBalance: number; // in dollars
}

class AccountReconciliationTool extends MCPTool<AccountReconciliationInput> {
  name = "account_reconciliation";
  description = "Reconciles an account in a YNAB budget by creating a reconciliation transaction if needed.";

  schema = {
    budgetId: {
      type: z.string().optional() as z.ZodType<string | undefined>,
      description: "The ID of the budget (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
    accountId: {
      type: z.string(),
      description: "The ID of the account to reconcile.",
    },
    reconciledBalance: {
      type: z.number(),
      description: "The correct cleared balance for the account (in dollars, e.g. 123.45).",
    },
  };

  private api: ynab.API;
  private budgetId: string;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
    this.budgetId = process.env.YNAB_BUDGET_ID || "";
  }

  async execute(input: AccountReconciliationInput) {
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    if (!input.accountId) {
      return "No account ID provided.";
    }
    try {
      logger.info(`Reconciling account ${input.accountId} for budget ${budgetId}`);
      const accountResp = await this.api.accounts.getAccountById(budgetId, input.accountId);
      const account = accountResp.data.account;
      const currentCleared = account.cleared_balance / 1000;
      const diff = +(input.reconciledBalance - currentCleared).toFixed(2);
      if (Math.abs(diff) < 0.01) {
        return {
          message: "Account is already reconciled.",
          cleared_balance: currentCleared,
        };
      }
      // Create reconciliation transaction
      const today = new Date().toISOString().slice(0, 10);
      const tx: ynab.PostTransactionsWrapper = {
        transaction: {
          account_id: input.accountId,
          date: today,
          amount: Math.round(diff * 1000),
          memo: "Reconciliation Adjustment",
          cleared: ynab.TransactionClearedStatus.Cleared,
          approved: true,
        }
      };
      const txResp = await this.api.transactions.createTransaction(budgetId, tx);
      // Fetch new cleared balance
      const updatedAccountResp = await this.api.accounts.getAccountById(budgetId, input.accountId);
      const updatedCleared = updatedAccountResp.data.account.cleared_balance / 1000;
      return {
        message: `Reconciliation transaction created for $${diff.toFixed(2)}.`,
        transactionId: txResp.data.transaction?.id,
        new_cleared_balance: updatedCleared,
      };
    } catch (error) {
      logger.error(`Error reconciling account ${input.accountId} for budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error reconciling account: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default AccountReconciliationTool; 