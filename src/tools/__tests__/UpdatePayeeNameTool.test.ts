import { describe, it, expect } from "vitest";
import UpdatePayeeNameTool from "../UpdatePayeeNameTool";
import { getTestBudgetId, skipIfNoTestBudgetId, getFirstPayee } from "./testUtils";

const itMutable = skipIfNoTestBudgetId(it as any);

describe("UpdatePayeeNameTool", () => {
  it("validates schema for required parameters", () => {
    const tool = new UpdatePayeeNameTool();
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(false);
    expect(schema.payeeId.type.safeParse(undefined).success).toBe(false);
    expect(schema.name.type.safeParse(undefined).success).toBe(false);
    expect(schema.budgetId.type.safeParse("budget-123").success).toBe(true);
    expect(schema.payeeId.type.safeParse("payee-123").success).toBe(true);
    expect(schema.name.type.safeParse("New Payee Name").success).toBe(true);
  });

  it("returns error for missing budgetId", async () => {
    const tool = new UpdatePayeeNameTool();
    const result = await tool.execute({
      payeeId: "payee-123",
      name: "New Name",
    } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/budget ID/i);
  });

  it("returns error for missing payeeId", async () => {
    const tool = new UpdatePayeeNameTool();
    const result = await tool.execute({
      budgetId: "budget-123",
      name: "New Name",
    } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/payee ID/i);
  });

  it("returns error for missing name", async () => {
    const tool = new UpdatePayeeNameTool();
    const result = await tool.execute({
      budgetId: "budget-123",
      payeeId: "payee-123",
    } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/name/i);
  });

  itMutable("updates a payee name in the test budget", async () => {
    const tool = new UpdatePayeeNameTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) {
      throw new Error("Test budget ID not set");
    }
    // Get the first available payee
    const payee = await getFirstPayee(budgetId);
    const newName = `Test Payee ${Date.now()}`;
    const result = await tool.execute({
      budgetId,
      payeeId: payee.id,
      name: newName,
    });
    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("payee");
    expect((result as any).payee).toHaveProperty("name");
    expect((result as any).payee.name).toBe(newName);
  });
}); 