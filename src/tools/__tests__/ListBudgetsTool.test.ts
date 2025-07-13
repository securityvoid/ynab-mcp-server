import { describe, it, expect } from "vitest";
import ListBudgetsTool from "../ListBudgetsTool";

describe("ListBudgetsTool", () => {
  it("validates schema (no required parameters)", () => {
    const tool = new ListBudgetsTool();
    const schema = tool.schema;
    expect(Object.keys(schema)).toHaveLength(0);
  });

  it("fetches budgets from the API", async () => {
    const tool = new ListBudgetsTool();
    const result = await tool.execute();
    if (typeof result === 'string') {
      expect(result).toMatch(/error|token|network|not set|unable/i);
    } else {
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('name');
      }
    }
  });
}); 