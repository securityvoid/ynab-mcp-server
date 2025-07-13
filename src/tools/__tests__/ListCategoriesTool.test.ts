import { describe, it, expect } from "vitest";
import ListCategoriesTool from "../ListCategoriesTool";
import { getTestBudgetId, skipIfNoTestBudgetId } from "./testUtils";

const itMutable = skipIfNoTestBudgetId(it as any);

describe("ListCategoriesTool", () => {
  it("validates schema for required budgetId", () => {
    const tool = new ListCategoriesTool();
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(true);
    expect(schema.budgetId.type.safeParse("budget-123").success).toBe(true);
  });

  it("returns error for missing budgetId", async () => {
    const tool = new ListCategoriesTool();
    const result = await tool.execute({} as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/budget ID/i);
  });

  itMutable("fetches categories from the test budget", async () => {
    const tool = new ListCategoriesTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) {
      throw new Error("Test budget ID not set");
    }
    const result = await tool.execute({ budgetId });
    expect(Array.isArray(result)).toBe(true);
    if ((result as any[]).length > 0) {
      const firstGroup = (result as any[])[0];
      expect(firstGroup).toHaveProperty("id");
      expect(firstGroup).toHaveProperty("name");
      expect(firstGroup).toHaveProperty("categories");
      if (Array.isArray(firstGroup.categories) && firstGroup.categories.length > 0) {
        expect(firstGroup.categories[0]).toHaveProperty("id");
        expect(firstGroup.categories[0]).toHaveProperty("name");
      }
    }
  });
}); 