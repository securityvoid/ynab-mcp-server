// GetUserInfoTool.ts
//
// Tool for fetching user info from the YNAB API.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface GetUserInfoInput {}

class GetUserInfoTool extends MCPTool<GetUserInfoInput> {
  name = "get_user_info";
  description = "Fetches user info from the YNAB API.";

  schema = {};

  private api: ynab.API;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
  }

  async execute(_: GetUserInfoInput) {
    try {
      logger.info(`Fetching user info`);
      const resp = await this.api.user.getUser();
      return resp.data.user;
    } catch (error) {
      logger.error(`Error fetching user info:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error fetching user info: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default GetUserInfoTool; 