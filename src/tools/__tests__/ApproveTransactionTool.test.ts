import { describe, it, expect } from "vitest";
import ApproveTransactionTool from "../ApproveTransactionTool";
import {
  getTestBudgetId,
  skipIfNoTestBudgetId,
  createTestAccount,
  getFirstCategory,
  deleteTestTransaction,
} from "./testUtils";
import * as ynab from "ynab";

const itMutable = skipIfNoTestBudgetId(it as any);
const api = new ynab.API(process.env.YNAB_API_TOKEN || "");

describe("ApproveTransactionTool", () => {
  itMutable("approves a transaction in the test budget", async () => {
    const tool = new ApproveTransactionTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) throw new Error("Test budget ID not set");

    // Create a test account
    const account = await createTestAccount(budgetId);
    // Get the first available category
    const category = await getFirstCategory(budgetId);

    // Create an unapproved transaction
    const txData: ynab.SaveTransactionWithOptionalFields = {
      account_id: account.id,
      date: new Date().toISOString().slice(0, 10),
      amount: 1000,
      category_id: category.id,
      memo: "Approve Test Transaction",
      cleared: ynab.TransactionClearedStatus.Cleared,
      approved: false,
    };
    const txResp = await api.transactions.createTransaction(budgetId, { transaction: txData });
    const transactionId = txResp.data.transaction!.id;

    // Approve the transaction
    const result = await tool.execute({ budgetId, transactionId });
    expect(typeof result).toBe("object");
    expect((result as any)).toHaveProperty("id");
    expect((result as any)).toHaveProperty("approved");
    expect((result as any).approved).toBe(true);

    // Fetch the transaction to validate
    const txAfter = (await api.transactions.getTransactionById(budgetId, transactionId)).data.transaction;
    expect(txAfter.approved).toBe(true);

    // Clean up: delete the transaction
    await deleteTestTransaction(budgetId, transactionId);
  });
}); 