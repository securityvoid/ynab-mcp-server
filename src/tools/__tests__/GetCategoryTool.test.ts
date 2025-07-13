import { describe, it, expect, vi } from "vitest";
import GetCategoryTool from "../GetCategoryTool";
import { getTestBudgetId, skipIfNoTestBudgetId, getFirstCategory } from "./testUtils";

// Mock ynab API
vi.mock('ynab', () => {
  return {
    API: class {
      categories = {
        getCategoryById: vi.fn(),
      };
    },
  };
});

const itMutable = skipIfNoTestBudgetId(it as any);

describe('GetCategoryTool', () => {
  let tool: GetCategoryTool;
  let getCategoryByIdMock: any;

  const mockCategory = {
    id: 'cat-1',
    name: 'Groceries',
    category_group_id: 'group-1',
    budgeted: 10000,
    activity: -5000,
    balance: 5000,
    goal_type: null,
    goal_target: null,
    note: 'Test note',
  };

  beforeEach(() => {
    tool = new GetCategoryTool();
    // @ts-ignore
    getCategoryByIdMock = tool.api.categories.getCategoryById;
    getCategoryByIdMock.mockReset();
  });

  it('returns category for a valid budget and categoryId', async () => {
    getCategoryByIdMock.mockResolvedValue({ data: { category: mockCategory } });
    const result = await tool.execute({ budgetId: 'budget-1', categoryId: 'cat-1' });
    expect(result).toEqual({
      id: 'cat-1',
      name: 'Groceries',
      group_id: 'group-1',
      budgeted: 10,
      activity: -5,
      balance: 5,
      goal_type: null,
      goal_target: null,
      note: 'Test note',
    });
  });

  it('returns error if no budgetId is provided and env is empty', async () => {
    // @ts-ignore
    tool.budgetId = '';
    const result = await tool.execute({ categoryId: 'cat-1' });
    expect(result).toMatch(/No budget ID provided/);
  });

  it('returns error if no categoryId is provided', async () => {
    const result = await tool.execute({ budgetId: 'budget-1', categoryId: '' });
    expect(result).toMatch(/No category ID provided/);
  });

  it('handles API errors gracefully', async () => {
    getCategoryByIdMock.mockRejectedValue(new Error('API failure'));
    const result = await tool.execute({ budgetId: 'budget-1', categoryId: 'cat-1' });
    expect(result).toMatch(/Error getting category/);
  });
});

describe("GetCategoryTool", () => {
  it("validates schema for required parameters", () => {
    const tool = new GetCategoryTool();
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(true);
    expect(schema.categoryId.type.safeParse(undefined).success).toBe(false);
    expect(schema.budgetId.type.safeParse("budget-123").success).toBe(true);
    expect(schema.categoryId.type.safeParse("category-123").success).toBe(true);
  });

  it("returns error for missing budgetId", async () => {
    const tool = new GetCategoryTool();
    const result = await tool.execute({
      categoryId: "category-123",
    } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/budget ID/i);
  });

  it("returns error for missing categoryId", async () => {
    const tool = new GetCategoryTool();
    const result = await tool.execute({
      budgetId: "budget-123",
    } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/category ID/i);
  });

  itMutable("fetches a category from the test budget", async () => {
    const tool = new GetCategoryTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) throw new Error("Test budget ID not set");

    // Get the first available category
    const category = await getFirstCategory(budgetId);

    // Fetch the category using the tool
    const result = await tool.execute({ budgetId, categoryId: category.id });
    expect(typeof result).toBe("object");
    expect((result as any)).toHaveProperty("id");
    expect((result as any)).toHaveProperty("name");
    expect((result as any)).toHaveProperty("category_group_id");
    expect((result as any).id).toBe(category.id);
  });
}); 