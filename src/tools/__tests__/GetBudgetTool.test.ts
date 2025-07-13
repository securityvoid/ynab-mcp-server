import { describe, it, expect } from "vitest";
import GetBudgetTool from "../GetBudgetTool";
import { getTestBudgetId, skipIfNoTestBudgetId } from "./testUtils";

const itMutable = skipIfNoTestBudgetId(it);

describe("GetBudgetTool", () => {
  it("validates schema for required budgetId", () => {
    const tool = new GetBudgetTool();
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(false);
    expect(schema.budgetId.type.safeParse("budget-123").success).toBe(true);
  });

  it("returns error for missing budgetId", async () => {
    const tool = new GetBudgetTool();
    const result = await tool.execute({} as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/budget ID/i);
  });

  itMutable("fetches a specific budget from the API", async () => {
    const tool = new GetBudgetTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) {
      throw new Error("Test budget ID not set");
    }
    
    const result = await tool.execute({ budgetId });
    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("last_modified_on");
    expect(result.id).toBe(budgetId);
  });
}); 