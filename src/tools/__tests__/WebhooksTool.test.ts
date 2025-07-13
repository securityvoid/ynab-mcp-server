import { describe, it, expect } from "vitest";
import WebhooksTool from "../WebhooksTool";

const tool = new WebhooksTool();

describe("WebhooksTool", () => {
  it("returns not supported message for any input", async () => {
    const result = await tool.execute({
      budgetId: "test-budget",
      eventType: "transaction_created",
      webhookUrl: "https://example.com/webhook",
    });
    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("message");
    expect(result.message).toMatch(/not supported by the official YNAB API/i);
  });

  it("returns not supported message for empty input", async () => {
    const result = await tool.execute({});
    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("message");
    expect(result.message).toMatch(/not supported by the official YNAB API/i);
  });

  it("validates schema for optional fields", () => {
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(true);
    expect(schema.eventType.type.safeParse(undefined).success).toBe(true);
    expect(schema.webhookUrl.type.safeParse(undefined).success).toBe(true);
  });
}); 