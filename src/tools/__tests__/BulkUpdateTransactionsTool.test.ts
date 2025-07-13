import { describe, it, expect } from "vitest";
import BulkUpdateTransactionsTool from "../BulkUpdateTransactionsTool";
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

describe("BulkUpdateTransactionsTool", () => {
  itMutable("bulk updates a transaction's memo in the test budget", async () => {
    const tool = new BulkUpdateTransactionsTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) throw new Error("Test budget ID not set");

    // Create a test account
    const account = await createTestAccount(budgetId);
    // Get the first available category
    const category = await getFirstCategory(budgetId);

    // Create a transaction
    const txData: ynab.SaveTransactionWithOptionalFields = {
      account_id: account.id,
      date: new Date().toISOString().slice(0, 10),
      amount: 1000,
      category_id: category.id,
      memo: "Bulk Update Test Transaction",
      cleared: ynab.TransactionClearedStatus.Cleared,
      approved: true,
    };
    const txResp = await api.transactions.createTransaction(budgetId, { transaction: txData });
    const transactionId = txResp.data.transaction!.id;

    // Bulk update the transaction's memo
    const newMemo = `Bulk Update Memo ${Date.now()}`;
    const result = await tool.execute({
      budgetId,
      updates: [
        { transactionId, memo: newMemo },
      ],
    });
    expect(Array.isArray(result)).toBe(true);
    expect((result as any)[0]).toHaveProperty("success");
    expect((result as any)[0].success).toBe(true);
    expect((result as any)[0]).toHaveProperty("updated");
    expect((result as any)[0].updated).toHaveProperty("memo");
    expect((result as any)[0].updated.memo).toBe(newMemo);

    // Fetch the transaction to validate
    const txAfter = (await api.transactions.getTransactionById(budgetId, transactionId)).data.transaction;
    expect(txAfter.memo).toBe(newMemo);

    // Clean up: delete the transaction
    await deleteTestTransaction(budgetId, transactionId);
  });
}); 