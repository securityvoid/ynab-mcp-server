import { describe, it, expect } from "vitest";
import UpdateCategoryGoalTool from "../UpdateCategoryGoalTool";
import { getTestBudgetId, skipIfNoTestBudgetId, getFirstCategory } from "./testUtils";

const itMutable = skipIfNoTestBudgetId(it as any);

describe("UpdateCategoryGoalTool", () => {
  itMutable("updates a category goal in the test budget", async () => {
    const tool = new UpdateCategoryGoalTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) throw new Error("Test budget ID not set");

    // Get the first available category
    const category = await getFirstCategory(budgetId);

    // Update the category goal
    const result = await tool.execute({
      budgetId,
      categoryId: category.id,
      goal_target: 100000, // $100.00 in milliunits
    });
    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("goal_target_amount");
    expect((result as any).goal_target_amount).toBe(100000);
  });
}); 