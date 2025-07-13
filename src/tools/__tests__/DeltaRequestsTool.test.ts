import { describe, it, expect } from "vitest";
import DeltaRequestsTool from "../DeltaRequestsTool";
import { getTestBudgetId, skipIfNoTestBudgetId } from "./testUtils";

const itMutable = skipIfNoTestBudgetId(it as any);

describe("DeltaRequestsTool", () => {
  it("validates schema for required budgetId", () => {
    const tool = new DeltaRequestsTool();
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(true);
    expect(schema.budgetId.type.safeParse("budget-123").success).toBe(true);
  });

  it("returns error for missing budgetId", async () => {
    const tool = new DeltaRequestsTool();
    const result = await tool.execute({ resource: "accounts", lastKnowledgeOfServer: 0 } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/budget ID/i);
  });

  itMutable("fetches delta requests from the test budget", async () => {
    const tool = new DeltaRequestsTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) {
      throw new Error("Test budget ID not set");
    }
    const result = await tool.execute({ budgetId, resource: "accounts", lastKnowledgeOfServer: 0 });
    expect(typeof result).toBe("object");
    expect((result as any)).toHaveProperty("server_knowledge");
    expect((result as any)).toHaveProperty("accounts");
  });
}); 