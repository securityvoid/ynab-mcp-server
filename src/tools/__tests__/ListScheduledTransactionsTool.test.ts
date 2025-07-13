import { describe, it, expect } from "vitest";
import ListScheduledTransactionsTool from "../ListScheduledTransactionsTool";
import { getTestBudgetId, skipIfNoTestBudgetId } from "./testUtils";

const itMutable = skipIfNoTestBudgetId(it as any);

describe("ListScheduledTransactionsTool", () => {
  it("validates schema for required budgetId", () => {
    const tool = new ListScheduledTransactionsTool();
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(true);
    expect(schema.budgetId.type.safeParse("budget-123").success).toBe(true);
  });

  it("returns error for missing budgetId", async () => {
    const tool = new ListScheduledTransactionsTool();
    const result = await tool.execute({} as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/budget ID/i);
  });

  itMutable("fetches scheduled transactions from the test budget", async () => {
    const tool = new ListScheduledTransactionsTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) {
      throw new Error("Test budget ID not set");
    }
    const result = await tool.execute({ budgetId });
    expect(Array.isArray(result)).toBe(true);
    if ((result as any[]).length > 0) {
      expect((result as any[])[0]).toHaveProperty("id");
      expect((result as any[])[0]).toHaveProperty("amount");
      expect((result as any[])[0]).toHaveProperty("date_next");
      expect((result as any[])[0]).toHaveProperty("account_id");
    }
  });
}); 