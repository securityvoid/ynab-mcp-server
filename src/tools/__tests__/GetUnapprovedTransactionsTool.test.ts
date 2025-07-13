import { describe, it, expect } from "vitest";
import GetUnapprovedTransactionsTool from "../GetUnapprovedTransactionsTool";
import { getTestBudgetId, skipIfNoTestBudgetId } from "./testUtils";

const itMutable = skipIfNoTestBudgetId(it as any);

describe("GetUnapprovedTransactionsTool", () => {
  it("validates schema for required budgetId", () => {
    const tool = new GetUnapprovedTransactionsTool();
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(true);
    expect(schema.budgetId.type.safeParse("budget-123").success).toBe(true);
  });

  it("returns error for missing budgetId", async () => {
    const tool = new GetUnapprovedTransactionsTool();
    const result = await tool.execute({} as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/budget ID/i);
  });

  itMutable("fetches unapproved transactions from the test budget", async () => {
    const tool = new GetUnapprovedTransactionsTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) {
      throw new Error("Test budget ID not set");
    }
    const result = await tool.execute({ budgetId });
    if (typeof result === "object" && result && Array.isArray((result as any).transactions)) {
      if ((result as any).transactions.length > 0) {
        expect((result as any).transactions[0]).toHaveProperty("id");
        expect((result as any).transactions[0]).toHaveProperty("amount");
        expect((result as any).transactions[0]).toHaveProperty("date");
        expect((result as any).transactions[0].approved).toBe(false);
      }
    }
  });
}); 