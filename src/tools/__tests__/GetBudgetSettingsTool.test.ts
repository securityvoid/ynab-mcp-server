import { describe, it, expect } from "vitest";
import GetBudgetSettingsTool from "../GetBudgetSettingsTool";
import { getTestBudgetId, skipIfNoTestBudgetId } from "./testUtils";

const itMutable = skipIfNoTestBudgetId(it);

describe("GetBudgetSettingsTool", () => {
  it("validates schema for required budgetId", () => {
    const tool = new GetBudgetSettingsTool();
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(false);
    expect(schema.budgetId.type.safeParse("budget-123").success).toBe(true);
  });

  it("returns error for missing budgetId", async () => {
    const tool = new GetBudgetSettingsTool();
    const result = await tool.execute({} as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/budget ID/i);
  });

  itMutable("fetches budget settings from the API", async () => {
    const tool = new GetBudgetSettingsTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) {
      throw new Error("Test budget ID not set");
    }
    
    const result = await tool.execute({ budgetId });
    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("settings");
    expect(result.settings).toHaveProperty("date_format");
    expect(result.settings).toHaveProperty("currency_format");
  });
}); 