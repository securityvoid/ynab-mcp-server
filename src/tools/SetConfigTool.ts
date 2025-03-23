import { MCPTool, logger } from "mcp-framework";
import * as fs from "fs/promises";
import * as path from "path";

interface SetConfigSchema {
  key: string;
  value: string;
}

class SetConfigTool extends MCPTool {
  name = "set_config";
  description = "Stores a configuration value for use by other tools";

  schema = {
    type: "object",
    properties: {
      key: { type: "string", description: "The configuration key to store" },
      value: { type: "string", description: "The value to store" },
    },
    required: ["key", "value"],
  };

  private configPath = path.join(process.cwd(), ".config.json");

  async execute(params: SetConfigSchema) {
    try {
      // Load existing config
      let config: Record<string, string> = {};
      try {
        const existingConfig = await fs.readFile(this.configPath, "utf-8");
        config = JSON.parse(existingConfig);
      } catch (err) {
        // File doesn't exist yet, that's ok
      }

      // Update config
      config[params.key] = params.value;

      // Save config
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));

      logger.info(`Stored config value for key: ${params.key}`);
      return JSON.stringify({ success: true, key: params.key });
    } catch (error) {
      logger.error(`Error storing config: ${error}`);
      throw new Error(`Failed to store config: ${error}`);
    }
  }
}

export default SetConfigTool;
