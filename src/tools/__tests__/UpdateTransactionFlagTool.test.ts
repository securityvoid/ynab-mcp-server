import { describe, it, expect } from "vitest";
import UpdateTransactionFlagTool from "../UpdateTransactionFlagTool";
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

describe("UpdateTransactionFlagTool", () => {
  itMutable("updates a transaction flag in the test budget", async () => {
    const tool = new UpdateTransactionFlagTool();
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
      memo: "Flag Test Transaction",
      cleared: ynab.TransactionClearedStatus.Cleared,
      approved: true,
    };
    const txResp = await api.transactions.createTransaction(budgetId, { transaction: txData });
    const transactionId = txResp.data.transaction!.id;

    // Update the transaction flag
    const flag_name = "red";
    const result = await tool.execute({
      budgetId,
      transactionId,
      flag_name,
    });
    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("flag_color");
    expect((result as any).flag_color).toBe(flag_name);

    // Fetch the transaction to validate
    const txAfter = (await api.transactions.getTransactionById(budgetId, transactionId)).data.transaction;
    expect(txAfter.flag_color).toBe(flag_name);

    // Clean up: delete the transaction
    await deleteTestTransaction(budgetId, transactionId);
  });
}); 