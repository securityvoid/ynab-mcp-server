import { MCPTool, logger } from "mcp-framework";
import * as fs from "fs/promises";
import * as path from "path";

interface GetConfigSchema {
  key: string;
}

class GetConfigTool extends MCPTool {
  name = "get_config";
  description = "Retrieves a stored configuration value";

  schema = {
    type: "object",
    properties: {
      key: { type: "string", description: "The configuration key to retrieve" },
    },
    required: ["key"],
  };

  private configPath = path.join(process.cwd(), ".config.json");

  async execute(params: GetConfigSchema) {
    try {
      // Load config
      let config: Record<string, string> = {};
      try {
        const existingConfig = await fs.readFile(this.configPath, "utf-8");
        config = JSON.parse(existingConfig);
      } catch (err) {
        // File doesn't exist yet
        return JSON.stringify({ value: null });
      }

      const value = config[params.key];
      logger.info(`Retrieved config value for key: ${params.key}`);
      return JSON.stringify({ value });
    } catch (error) {
      logger.error(`Error retrieving config: ${error}`);
      throw new Error(`Failed to retrieve config: ${error}`);
    }
  }
}

export default GetConfigTool;
