import { describe, it, expect } from "vitest";
import UpdateScheduledTransactionFlagTool from "../UpdateScheduledTransactionFlagTool";
import { getTestBudgetId, skipIfNoTestBudgetId } from "./testUtils";

const itMutable = skipIfNoTestBudgetId(it as any);

describe("UpdateScheduledTransactionFlagTool", () => {
  it("validates schema for required parameters", () => {
    const tool = new UpdateScheduledTransactionFlagTool();
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(false);
    expect(schema.scheduledTransactionId.type.safeParse(undefined).success).toBe(false);
    expect(schema.flag_name.type.safeParse(undefined).success).toBe(false);
    expect(schema.budgetId.type.safeParse("budget-123").success).toBe(true);
    expect(schema.scheduledTransactionId.type.safeParse("sched-123").success).toBe(true);
    expect(schema.flag_name.type.safeParse("red").success).toBe(true);
  });

  it("returns error for missing budgetId", async () => {
    const tool = new UpdateScheduledTransactionFlagTool();
    const result = await tool.execute({
      scheduledTransactionId: "sched-123",
      flag_name: "red",
    } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/budget ID/i);
  });

  it("returns error for missing scheduledTransactionId", async () => {
    const tool = new UpdateScheduledTransactionFlagTool();
    const result = await tool.execute({
      budgetId: "budget-123",
      flag_name: "red",
    } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/scheduled transaction ID/i);
  });

  it("returns error for missing flag_name", async () => {
    const tool = new UpdateScheduledTransactionFlagTool();
    const result = await tool.execute({
      budgetId: "budget-123",
      scheduledTransactionId: "sched-123",
    } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/flag/i);
  });

  itMutable("updates a scheduled transaction flag in the test budget", async () => {
    const tool = new UpdateScheduledTransactionFlagTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) {
      throw new Error("Test budget ID not set");
    }
    // Dynamically fetch the first available scheduled transaction
    const ynab = require("ynab");
    const ynabAPI = new ynab.API(process.env.YNAB_API_TOKEN);
    const scheduledResp = await ynabAPI.scheduledTransactions.getScheduledTransactions(budgetId);
    const scheduled = scheduledResp.data.scheduled_transactions;
    if (!scheduled || scheduled.length === 0) {
      console.warn("No scheduled transactions found in the test budget. Skipping test.");
      return;
    }
    const scheduledTransactionId = scheduled[0].id;
    const flag_name = "red";
    const result = await tool.execute({
      budgetId,
      scheduledTransactionId,
      flag_name,
    });
    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("flag_color");
    expect((result as any).flag_color).toBe(flag_name);
  });
}); 