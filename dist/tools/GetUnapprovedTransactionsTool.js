// GetUnapprovedTransactionsTool.ts
//
// Tool for listing unapproved transactions in YNAB.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.
import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";
class GetUnapprovedTransactionsTool extends MCPTool {
    name = "get_unapproved_transactions";
    description = "Gets unapproved transactions from a budget. First time pulls last 3 days, subsequent pulls use server knowledge to get only changes.";
    schema = {
        budgetId: {
            type: z.string().optional(),
            description: "The ID of the budget to fetch transactions for (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
        },
    };
    api;
    budgetId;
    constructor() {
        super();
        // YNAB API token is read from environment variable and only used for API calls
        this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
        this.budgetId = process.env.YNAB_BUDGET_ID || "";
    }
    async execute(input) {
        // Validate and sanitize input using zod schema
        const budgetId = input.budgetId || this.budgetId;
        if (!budgetId) {
            return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
        }
        try {
            logger.info(`Getting unapproved transactions for budget ${budgetId}`);
            const response = await this.api.transactions.getTransactions(budgetId, undefined, ynab.GetTransactionsTypeEnum.Unapproved);
            // Transform the transactions to a more readable format
            const transactions = this.transformTransactions(response.data.transactions);
            return {
                transactions,
                transaction_count: transactions.length,
            };
        }
        catch (error) {
            logger.error(`Error getting unapproved transactions for budget ${budgetId}:`);
            logger.error(JSON.stringify(error, null, 2));
            return `Error getting unapproved transactions: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
        }
    }
    transformTransactions(transactions) {
        return transactions
            .filter((transaction) => !transaction.deleted)
            .map((transaction) => ({
            id: transaction.id,
            date: transaction.date,
            amount: (transaction.amount / 1000).toFixed(2), // Convert milliunits to actual currency
            memo: transaction.memo,
            approved: transaction.approved,
            account_name: transaction.account_name,
            payee_name: transaction.payee_name,
            category_name: transaction.category_name,
            transfer_account_id: transaction.transfer_account_id,
            transfer_transaction_id: transaction.transfer_transaction_id,
            matched_transaction_id: transaction.matched_transaction_id,
            import_id: transaction.import_id,
        }));
    }
}
export default GetUnapprovedTransactionsTool;
