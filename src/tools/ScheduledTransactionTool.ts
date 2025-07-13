// ScheduledTransactionTool.ts
//
// Tool for getting, creating, updating, and deleting a scheduled transaction in a YNAB budget.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";
import type { PostScheduledTransactionWrapper, PutScheduledTransactionWrapper } from "ynab/dist/models";

type Action = "get" | "create" | "update" | "delete";

interface ScheduledTransactionInput {
  budgetId?: string;
  action: Action;
  scheduledTransactionId?: string;
  data?: {
    accountId?: string;
    dateFirst?: string;
    frequency?: string;
    amount?: number;
    memo?: string;
    payeeId?: string;
    categoryId?: string;
    cleared?: boolean;
    approved?: boolean;
    flagColor?: string;
  };
}

class ScheduledTransactionTool extends MCPTool<ScheduledTransactionInput> {
  name = "scheduled_transaction";
  description = "Gets, creates, updates, or deletes a scheduled transaction in a YNAB budget. Use 'action' to specify the operation.";

  schema = {
    budgetId: {
      type: z.string().optional() as unknown as z.ZodType<string | undefined>,
      description: "The ID of the budget (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
    action: {
      type: z.enum(["get", "create", "update", "delete"]),
      description: "The action to perform: get, create, update, or delete.",
    },
    scheduledTransactionId: {
      type: z.string().optional() as unknown as z.ZodType<string | undefined>,
      description: "The ID of the scheduled transaction (required for get, update, delete).",
    },
    data: {
      type: z.object({
        accountId: z.string().optional(),
        dateFirst: z.string().optional(),
        frequency: z.string().optional(),
        amount: z.number().optional(),
        memo: z.string().optional(),
        payeeId: z.string().optional(),
        categoryId: z.string().optional(),
        cleared: z.boolean().optional(),
        approved: z.boolean().optional(),
        flagColor: z.string().optional(),
      }).optional(),
      description: "Fields for create or update.",
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

  async execute(input: ScheduledTransactionInput) {
    // Validate and sanitize input using zod schema
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    const { action, scheduledTransactionId, data } = input;
    try {
      if (action === "get") {
        if (!scheduledTransactionId) return "No scheduled transaction ID provided.";
        logger.info(`Getting scheduled transaction ${scheduledTransactionId} for budget ${budgetId}`);
        const response = await this.api.scheduledTransactions.getScheduledTransactionById(budgetId, scheduledTransactionId);
        const tx = response.data.scheduled_transaction;
        return tx;
      } else if (action === "create") {
        if (!data || !data.accountId || !data.dateFirst || !data.frequency || data.amount === undefined) {
          return "Missing required fields for creating a scheduled transaction.";
        }
        logger.info(`Creating scheduled transaction for budget ${budgetId}`);
        const createObj: PostScheduledTransactionWrapper = {
          scheduled_transaction: {
            account_id: data.accountId,
            date: data.dateFirst!,
            frequency: data.frequency as ynab.ScheduledTransactionFrequency,
            amount: Math.round(data.amount * 1000),
            memo: data.memo,
            payee_id: data.payeeId,
            category_id: data.categoryId,
            flag_color: data.flagColor as ynab.TransactionFlagColor,
          }
        };
        const response = await this.api.scheduledTransactions.createScheduledTransaction(budgetId, createObj);
        return response.data.scheduled_transaction;
      } else if (action === "update") {
        if (!scheduledTransactionId) return "No scheduled transaction ID provided.";
        if (!data) return "No update data provided.";
        logger.info(`Updating scheduled transaction ${scheduledTransactionId} for budget ${budgetId}`);
        const updateObj: PutScheduledTransactionWrapper = {
          scheduled_transaction: {
            ...(data.accountId && typeof data.accountId === 'string' ? { account_id: data.accountId } : {}),
            ...(data.dateFirst ? { date: data.dateFirst } : {}),
            ...(data.frequency ? { frequency: data.frequency as ynab.ScheduledTransactionFrequency } : {}),
            ...(data.amount !== undefined ? { amount: Math.round(data.amount * 1000) } : {}),
            ...(data.memo ? { memo: data.memo } : {}),
            ...(data.payeeId ? { payee_id: data.payeeId } : {}),
            ...(data.categoryId ? { category_id: data.categoryId } : {}),
            ...(data.flagColor ? { flag_color: data.flagColor as ynab.TransactionFlagColor } : {}),
          }
        };
        const response = await this.api.scheduledTransactions.updateScheduledTransaction(budgetId, scheduledTransactionId, updateObj);
        return response.data.scheduled_transaction;
      } else if (action === "delete") {
        if (!scheduledTransactionId) return "No scheduled transaction ID provided.";
        logger.info(`Deleting scheduled transaction ${scheduledTransactionId} for budget ${budgetId}`);
        await this.api.scheduledTransactions.deleteScheduledTransaction(budgetId, scheduledTransactionId);
        return { success: true };
      } else {
        return "Invalid action.";
      }
    } catch (error) {
      logger.error(`Error with scheduled transaction action '${action}' for budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error with scheduled transaction: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default ScheduledTransactionTool; 