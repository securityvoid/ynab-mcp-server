import { describe, it, expect } from "vitest";
import GetPayeeTool from "../GetPayeeTool";
import { getTestBudgetId, skipIfNoTestBudgetId, getFirstPayee } from "./testUtils";

const itMutable = skipIfNoTestBudgetId(it as any);

describe("GetPayeeTool", () => {
  itMutable("fetches a payee from the test budget", async () => {
    const tool = new GetPayeeTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) throw new Error("Test budget ID not set");

    // Get the first available payee
    const payee = await getFirstPayee(budgetId);

    // Fetch the payee using the tool
    const result = await tool.execute({ budgetId, payeeId: payee.id });
    expect(typeof result).toBe("object");
    expect((result as any)).toHaveProperty("id");
    expect((result as any)).toHaveProperty("name");
    expect((result as any)).toHaveProperty("transfer_account_id");
    expect((result as any).id).toBe(payee.id);
  });
}); 