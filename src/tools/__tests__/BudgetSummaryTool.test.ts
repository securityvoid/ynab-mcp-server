import { describe, it, expect } from "vitest";
import BudgetSummaryTool from "../BudgetSummaryTool";
import { getTestBudgetId, skipIfNoTestBudgetId } from "./testUtils";

const itMutable = skipIfNoTestBudgetId(it as any);

describe("BudgetSummaryTool", () => {
  it("validates schema for optional budgetId", () => {
    const tool = new BudgetSummaryTool();
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(true);
    expect(schema.budgetId.type.safeParse("budget-123").success).toBe(true);
  });

  it("returns error for missing budgetId", async () => {
    const tool = new BudgetSummaryTool();
    const result = await tool.execute({} as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/budget ID/i);
  });

  itMutable("fetches budget summary from the test budget", async () => {
    const tool = new BudgetSummaryTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) {
      throw new Error("Test budget ID not set");
    }
    const result = await tool.execute({ budgetId, month: "current" });
    expect(typeof result).toBe("object");
    expect((result as any)).toHaveProperty("id");
    expect((result as any)).toHaveProperty("name");
    expect((result as any)).toHaveProperty("last_modified_on");
  });
}); 