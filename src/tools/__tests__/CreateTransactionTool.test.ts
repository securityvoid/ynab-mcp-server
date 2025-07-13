import { describe, expect } from "vitest";
import CreateTransactionTool from "../CreateTransactionTool";
import {
  getTestBudgetId,
  skipIfNoTestBudgetId,
  createTestAccount,
  getFirstCategory,
  deleteTestTransaction,
} from "./testUtils";
import * as ynab from "ynab";

const itMutable = skipIfNoTestBudgetId(it);

const api = new ynab.API(process.env.YNAB_API_TOKEN || "");

describe("CreateTransactionTool (integration)", () => {
  itMutable("creates and deletes a transaction in the test budget", async () => {
    const tool = new CreateTransactionTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) throw new Error("Test budget ID not set");

    // Create a test account
    const account = await createTestAccount(budgetId);
    // Get the first available category
    const category = await getFirstCategory(budgetId);

    // Create a transaction
    const amount = 12.345; // $12.345 in dollars
    const result = await tool.execute({
      budgetId,
      accountId: account.id,
      amount,
      categoryId: category.id,
      date: new Date().toISOString().slice(0, 10),
      memo: "Integration Test Transaction",
      cleared: true,
      approved: true,
      payeeName: "Integration Test Payee",
    });
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("transactionId");
    const transactionId = (result as any).transactionId;

    // Fetch the transaction to validate its properties
    const txResp = await api.transactions.getTransactionById(budgetId, transactionId);
    const tx = txResp.data.transaction;
    expect(tx).toBeDefined();
    expect(tx.account_id).toBe(account.id);
    expect(tx.category_id).toBe(category.id);
    expect(tx.amount).toBe(Math.round(amount * 1000));
    expect(tx.memo).toBe("Integration Test Transaction");
    expect(tx.cleared).toBe(ynab.TransactionClearedStatus.Cleared);
    expect(tx.approved).toBe(true);

    // Clean up: delete the transaction
    await deleteTestTransaction(budgetId, transactionId);
    // (Optionally) leave the test account, since accounts cannot be deleted via API
  });
}); 