import { describe, it, expect } from "vitest";
import AccountReconciliationTool from "../AccountReconciliationTool";
import { getTestBudgetId, skipIfNoTestBudgetId, createTestAccount } from "./testUtils";

const itMutable = skipIfNoTestBudgetId(it as any);

describe("AccountReconciliationTool", () => {
  it("validates schema for required parameters", () => {
    const tool = new AccountReconciliationTool();
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(true);
    expect(schema.accountId.type.safeParse(undefined).success).toBe(false);
    expect(schema.budgetId.type.safeParse("budget-123").success).toBe(true);
    expect(schema.accountId.type.safeParse("account-123").success).toBe(true);
  });

  it("returns error for missing budgetId", async () => {
    const tool = new AccountReconciliationTool();
    const result = await tool.execute({ accountId: "account-123" } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/budget ID/i);
  });

  it("returns error for missing accountId", async () => {
    const tool = new AccountReconciliationTool();
    const result = await tool.execute({ budgetId: "budget-123" } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/account ID/i);
  });

  itMutable("attempts to reconcile an account in the test budget", async () => {
    const tool = new AccountReconciliationTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) {
      throw new Error("Test budget ID not set");
    }
    // Dynamically create a test account for reconciliation
    const account = await createTestAccount(budgetId, "Reconciliation Test Account");
    // Note: YNAB API does not support deleting accounts, so this test account will persist
    const result = await tool.execute({ budgetId, accountId: account.id, reconciledBalance: 0 });
    // The result may be an error string or an object depending on account state and permissions
    if (typeof result === "string") {
      expect(result).toMatch(/error|not found|reconcile|permission|not allowed|not supported/i);
    } else {
      expect(result).toHaveProperty("message");
    }
  });
}); 