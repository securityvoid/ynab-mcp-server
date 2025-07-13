import { describe, it, expect } from "vitest";
import ListAccountsTool from "../ListAccountsTool";
import { getTestBudgetId, skipIfNoTestBudgetId } from "./testUtils";

const itMutable = skipIfNoTestBudgetId(it as any);

describe("ListAccountsTool", () => {
  itMutable("fetches accounts from the test budget", async () => {
    const tool = new ListAccountsTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) throw new Error("Test budget ID not set");
    const result = await tool.execute({ budgetId });
    expect(Array.isArray(result)).toBe(true);
    if ((result as any[]).length > 0) {
      expect((result as any[])[0]).toHaveProperty("id");
      expect((result as any[])[0]).toHaveProperty("name");
      expect((result as any[])[0]).toHaveProperty("type");
    }
  });
}); 