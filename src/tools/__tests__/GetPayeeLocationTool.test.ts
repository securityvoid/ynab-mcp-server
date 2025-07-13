import { describe, it, expect } from "vitest";
import GetPayeeLocationTool from "../GetPayeeLocationTool";
import { getTestBudgetId, skipIfNoTestBudgetId } from "./testUtils";

const itMutable = skipIfNoTestBudgetId(it as any);

describe("GetPayeeLocationTool", () => {
  it("validates schema for required parameters", () => {
    const tool = new GetPayeeLocationTool();
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(true);
    expect(schema.payeeLocationId.type.safeParse(undefined).success).toBe(false);
    expect(schema.budgetId.type.safeParse("budget-123").success).toBe(true);
    expect(schema.payeeLocationId.type.safeParse("ploc-123").success).toBe(true);
  });

  it("returns error for missing budgetId", async () => {
    const tool = new GetPayeeLocationTool();
    const result = await tool.execute({
      payeeLocationId: "ploc-123",
    } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/budget ID/i);
  });

  it("returns error for missing payeeLocationId", async () => {
    const tool = new GetPayeeLocationTool();
    const result = await tool.execute({
      budgetId: "budget-123",
    } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/payee location ID/i);
  });

  itMutable("fetches a payee location from the test budget", async () => {
    const tool = new GetPayeeLocationTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) {
      throw new Error("Test budget ID not set");
    }
    // Dynamically fetch the first available payee location
    const ynab = require("ynab");
    const ynabAPI = new ynab.API(process.env.YNAB_API_TOKEN);
    const payeeLocationsResponse = await ynabAPI.payeeLocations.getPayeeLocations(budgetId);
    const payeeLocations = payeeLocationsResponse.data.payee_locations;
    if (!payeeLocations || payeeLocations.length === 0) {
      console.warn("No payee locations found in the test budget. Skipping test.");
      return;
    }
    const payeeLocation = payeeLocations[0];
    const result = await tool.execute({
      budgetId,
      payeeLocationId: payeeLocation.id,
    });
    expect(typeof result).toBe("object");
    expect((result as any)).toHaveProperty("id");
    expect((result as any)).toHaveProperty("payee_id");
    expect((result as any)).toHaveProperty("latitude");
    expect((result as any)).toHaveProperty("longitude");
  });
}); 