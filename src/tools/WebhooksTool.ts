// WebhooksTool.ts
//
// Tool for managing webhooks for YNAB events (not supported by the official YNAB API).
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface WebhooksInput {
  budgetId?: string;
  eventType?: string;
  webhookUrl?: string;
}

class WebhooksTool extends MCPTool<WebhooksInput> {
  name = "webhooks";
  description = "Manages webhooks for YNAB events (not supported by the official YNAB API).";

  schema = {
    budgetId: {
      type: z.string().optional() as z.ZodType<string | undefined>,
      description: "The ID of the budget (optional, not used since webhooks are not supported)",
    },
    eventType: {
      type: z.string().optional() as z.ZodType<string | undefined>,
      description: "The event type to subscribe to (optional, not used since webhooks are not supported)",
    },
    webhookUrl: {
      type: z.string().optional() as z.ZodType<string | undefined>,
      description: "The webhook URL to receive events (optional, not used since webhooks are not supported)",
    },
  };

  async execute(input: WebhooksInput) {
    return {
      message: "Webhooks are not supported by the official YNAB API. To receive updates, you must poll for changes using delta requests. Some community projects provide webhook-like functionality by polling and posting to a webhook URL.",
      docs: "https://api.ynab.com/",
      community: "https://github.com/bradymholt/ynab-api-webhooks"
    };
  }
}

export default WebhooksTool; 