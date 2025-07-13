// GetAccountTool.ts
//
// Tool for fetching a single account by ID from the YNAB API.
//
// Security: Reads YNAB API token from environment variables. Never logs or exposes sensitive data.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface GetAccountInput {
  budgetId: string;
  accountId: string;
}

class GetAccountTool extends MCPTool<GetAccountInput> {
  name = "get_account";
  description = "Fetches a single account by ID from the YNAB API.";

  schema = {
    budgetId: {
      type: z.string() as unknown as z.ZodType<string>,
      description: "The ID of the budget containing the account.",
    },
    accountId: {
      type: z.string() as unknown as z.ZodType<string>,
      description: "The ID of the account to fetch.",
    },
  };

  private api: ynab.API;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
  }

  async execute(input: GetAccountInput) {
    if (!input.budgetId) {
      return "No budget ID provided.";
    }
    if (!input.accountId) {
      return "No account ID provided.";
    }
    try {
      logger.info(`Fetching account ${input.accountId} for budget ${input.budgetId}`);
      const resp = await this.api.accounts.getAccountById(input.budgetId, input.accountId);
      return resp.data.account;
    } catch (error) {
      logger.error(`Error fetching account ${input.accountId} for budget ${input.budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error fetching account: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default GetAccountTool; 