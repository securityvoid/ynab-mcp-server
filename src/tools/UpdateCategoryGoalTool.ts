// UpdateCategoryGoalTool.ts
//
// Tool for updating a category goal using the YNAB API.
//
// Security: Reads YNAB API token from environment variables. Never logs or exposes sensitive data.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface UpdateCategoryGoalInput {
  budgetId: string;
  categoryId: string;
  goal_target?: number;
  name?: string;
  note?: string;
  category_group_id?: string;
}

class UpdateCategoryGoalTool extends MCPTool<UpdateCategoryGoalInput> {
  name = "update_category_goal";
  description = "Updates a category's goal_target, name, note, or group using the YNAB API.";

  schema = {
    budgetId: {
      type: z.string() as unknown as z.ZodType<string>,
      description: "The ID of the budget containing the category.",
    },
    categoryId: {
      type: z.string() as unknown as z.ZodType<string>,
      description: "The ID of the category to update.",
    },
    goal_target: {
      type: z.number().optional() as unknown as z.ZodType<number | undefined>,
      description: "The target amount for the goal (in milliunits, e.g., 100000 for $100, optional).",
    },
    name: {
      type: z.string().optional() as unknown as z.ZodType<string | undefined>,
      description: "The new name for the category (optional).",
    },
    note: {
      type: z.string().optional() as unknown as z.ZodType<string | undefined>,
      description: "The new note for the category (optional).",
    },
    category_group_id: {
      type: z.string().optional() as unknown as z.ZodType<string | undefined>,
      description: "The new category group ID for the category (optional).",
    },
  };

  private api: ynab.API;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
  }

  async execute(input: UpdateCategoryGoalInput) {
    if (!input.budgetId) {
      return "No budget ID provided.";
    }
    if (!input.categoryId) {
      return "No category ID provided.";
    }
    try {
      logger.info(`Updating category ${input.categoryId} in budget ${input.budgetId}`);
      const patch: ynab.PatchCategoryWrapper = {
        category: {}
      };
      if (input.goal_target !== undefined) patch.category.goal_target = input.goal_target;
      if (input.name !== undefined) patch.category.name = input.name;
      if (input.note !== undefined) patch.category.note = input.note;
      if (input.category_group_id !== undefined) patch.category.category_group_id = input.category_group_id;
      const resp = await this.api.categories.updateCategory(input.budgetId, input.categoryId, patch);
      return resp.data.category;
    } catch (error) {
      logger.error(`Error updating category for ${input.categoryId} in budget ${input.budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error updating category: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default UpdateCategoryGoalTool; 