// GoalManagementTool.ts
//
// Tool for retrieving and summarizing goal information for all categories in a YNAB budget.

import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

interface GoalManagementInput {
  budgetId?: string;
}

class GoalManagementTool extends MCPTool<GoalManagementInput> {
  name = "goal_management";
  description = "Retrieves and summarizes goal information for all categories in a YNAB budget.";

  schema = {
    budgetId: {
      type: z.string().optional() as z.ZodType<string | undefined>,
      description: "The ID of the budget to summarize goals for (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
  };

  private api: ynab.API;
  private budgetId: string;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
    this.budgetId = process.env.YNAB_BUDGET_ID || "";
  }

  async execute(input: GoalManagementInput) {
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    try {
      logger.info(`Retrieving category goals for budget ${budgetId}`);
      const response = await this.api.categories.getCategories(budgetId);
      const categories = response.data.category_groups.flatMap(group =>
        group.categories.filter(category => !category.deleted && !category.hidden)
      );
      const goals = categories
        .filter(cat => cat.goal_type)
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          group_id: cat.category_group_id,
          goal_type: cat.goal_type,
          goal_target: cat.goal_target,
          balance: cat.balance / 1000,
          budgeted: cat.budgeted / 1000,
          activity: cat.activity / 1000,
          note: cat.note,
          on_track: cat.goal_target ? (cat.balance >= cat.goal_target ? true : false) : null,
        }));
      const onTrack = goals.filter(g => g.on_track === true);
      const offTrack = goals.filter(g => g.on_track === false);
      return {
        total_goals: goals.length,
        on_track: onTrack.length,
        off_track: offTrack.length,
        goals,
        summary: `You have ${goals.length} categories with goals. ${onTrack.length} are on track, ${offTrack.length} are not.`
      };
    } catch (error) {
      logger.error(`Error retrieving category goals for budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error retrieving category goals: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}

export default GoalManagementTool; 