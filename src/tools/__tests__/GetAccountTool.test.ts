import { describe, it, expect } from "vitest";
import GetAccountTool from "../GetAccountTool";
import { getTestBudgetId, skipIfNoTestBudgetId, createTestAccount } from "./testUtils";

const itMutable = skipIfNoTestBudgetId(it as any);

describe("GetAccountTool", () => {
  it("validates schema for required budgetId and accountId", () => {
    const tool = new GetAccountTool();
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(false);
    expect(schema.accountId.type.safeParse(undefined).success).toBe(false);
    expect(schema.budgetId.type.safeParse("budget-123").success).toBe(true);
    expect(schema.accountId.type.safeParse("account-123").success).toBe(true);
  });

  it("returns error for missing budgetId", async () => {
    const tool = new GetAccountTool();
    const result = await tool.execute({ accountId: "account-123" } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/budget ID/i);
  });

  it("returns error for missing accountId", async () => {
    const tool = new GetAccountTool();
    const result = await tool.execute({ budgetId: "budget-123" } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/account ID/i);
  });

  itMutable("fetches a specific account from the API", async () => {
    const tool = new GetAccountTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) {
      throw new Error("Test budget ID not set");
    }
    // Dynamically create a test account for this test
    const account = await createTestAccount(budgetId, "GetAccount Test Account");
    // Note: YNAB API does not support deleting accounts, so this test account will persist
    const result = await tool.execute({ budgetId, accountId: account.id });
    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("type");
    expect(result).toHaveProperty("balance");
    expect((result as any).id).toBe(account.id);
  });
}); 