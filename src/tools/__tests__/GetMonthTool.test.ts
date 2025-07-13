import { describe, it, expect } from "vitest";
import GetMonthTool from "../GetMonthTool";
import { getTestBudgetId, skipIfNoTestBudgetId } from "./testUtils";

const itMutable = skipIfNoTestBudgetId(it as any);

function getCurrentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

describe("GetMonthTool", () => {
  it("validates schema for required parameters", () => {
    const tool = new GetMonthTool();
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(true);
    expect(schema.month.type.safeParse(undefined).success).toBe(false);
    expect(schema.budgetId.type.safeParse("budget-123").success).toBe(true);
    expect(schema.month.type.safeParse("2024-01-01").success).toBe(true);
  });

  it("returns error for missing budgetId", async () => {
    const tool = new GetMonthTool();
    const result = await tool.execute({ month: "2024-01-01" } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/budget ID/i);
  });

  it("returns error for missing month", async () => {
    const tool = new GetMonthTool();
    const result = await tool.execute({ budgetId: "budget-123" } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/month/i);
  });

  itMutable("fetches a month from the test budget", async () => {
    const tool = new GetMonthTool();
    const budgetId = getTestBudgetId();
    const month = getCurrentMonthString();
    if (!budgetId) {
      throw new Error("Test budget ID not set");
    }
    const result = await tool.execute({ budgetId, month });
    expect(typeof result).toBe("object");
    expect((result as any)).toHaveProperty("month");
    expect((result as any)).toHaveProperty("income");
    expect((result as any)).toHaveProperty("budgeted");
  });
}); 