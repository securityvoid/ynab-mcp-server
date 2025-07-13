import { describe, it, expect } from "vitest";
import GetUpdateTransactionTool from "../GetUpdateTransactionTool";
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

describe("GetUpdateTransactionTool", () => {
  itMutable("fetches a transaction from the test budget", async () => {
    const tool = new GetUpdateTransactionTool();
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
      memo: "GetUpdate Test Transaction",
      cleared: ynab.TransactionClearedStatus.Cleared,
      approved: true,
    };
    const txResp = await api.transactions.createTransaction(budgetId, { transaction: txData });
    const transactionId = txResp.data.transaction!.id;

    // Fetch the transaction using the tool
    const result = await tool.execute({ budgetId, transactionId });
    expect(typeof result).toBe("object");
    expect((result as any)).toHaveProperty("id");
    expect((result as any)).toHaveProperty("amount");
    expect((result as any)).toHaveProperty("date");
    expect((result as any)).toHaveProperty("account_id");
    expect((result as any).id).toBe(transactionId);

    // Clean up: delete the transaction
    await deleteTestTransaction(budgetId, transactionId);
  });
}); 