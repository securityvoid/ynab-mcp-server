import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";
import Knowledge from "../knowledge.js";

interface GetTransactionsInput {
  budget_id: string;
}

class GetTransactionsTool extends MCPTool<GetTransactionsInput> {
  name = "ynab_get_transactions";
  description =
    "Gets transactions from a budget. First time pulls last 3 days, subsequent pulls use server knowledge to get only changes.";

  schema = {
    budget_id: {
      type: z.string(),
      description: "The ID of the budget to fetch transactions for",
    },
  };

  private api: ynab.API;
  private knowledge: Knowledge;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
    this.knowledge = new Knowledge();
  }

  async execute() {
    const budgetId = this.knowledge.getDefaultBudgetId();
    if (!budgetId) {
      return "No default budget ID found. Please set a default budget ID first.";
    }

    try {
      logger.info(`Getting transactions for budget ${budgetId}`);

      let response;

      // If we have last knowledge of server, use it
      const lastKnowledgeOfServer = this.knowledge.getLastKnowledgeOfServer();
      if (lastKnowledgeOfServer) {
        logger.info(`Using last_knowledge_of_server: ${lastKnowledgeOfServer}`);
        response = await this.api.transactions.getTransactions(
          budgetId,
          undefined,
          undefined,
          lastKnowledgeOfServer
        );
      } else {
        // First time pull - get last 3 days of transactions
        const today = new Date();
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);
        const sinceDate = threeDaysAgo.toISOString().split("T")[0];
        logger.info(`First pull, using since_date: ${sinceDate}`);

        response = await this.api.transactions.getTransactions(
          budgetId,
          sinceDate
        );
      }

      // Store the new server knowledge
      this.knowledge.updateLastKnowledgeOfServer(
        response.data.server_knowledge
      );
      logger.info(
        `Updated last_knowledge_of_server to: ${response.data.server_knowledge}`
      );

      this.knowledge.updateTransactions(budgetId, response.data.transactions);

      // Transform the transactions to a more readable format
      const transactions = this.transformTransactions(
        response.data.transactions
      );

      return {
        transactions,
        transaction_count: transactions.length,
      };
    } catch (error) {
      logger.error(`Error getting transactions for budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return {
        error: true,
        message: `Error getting transactions: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
      };
    }
  }

  private transformTransactions(transactions: ynab.TransactionDetail[]) {
    return transactions
      .filter((transaction) => !transaction.deleted)
      .map((transaction) => ({
        id: transaction.id,
        date: transaction.date,
        amount: (transaction.amount / 1000).toFixed(2), // Convert milliunits to actual currency
        memo: transaction.memo,
        cleared: transaction.cleared,
        approved: transaction.approved,
        flag_color: transaction.flag_color,
        account_id: transaction.account_id,
        account_name: transaction.account_name,
        payee_id: transaction.payee_id,
        payee_name: transaction.payee_name,
        category_id: transaction.category_id,
        category_name: transaction.category_name,
        transfer_account_id: transaction.transfer_account_id,
        transfer_transaction_id: transaction.transfer_transaction_id,
        matched_transaction_id: transaction.matched_transaction_id,
        import_id: transaction.import_id,
        deleted: transaction.deleted,
      }));
  }
}

export default GetTransactionsTool;
