import { describe, it, expect, vi, beforeEach } from 'vitest';
import ListMonthsTool from '../ListMonthsTool';
import { getTestBudgetId, skipIfNoTestBudgetId } from "./testUtils";

// Mock ynab API
vi.mock('ynab', () => {
  return {
    API: class {
      months = {
        getMonths: vi.fn(),
      };
    },
  };
});

const itMutable = skipIfNoTestBudgetId(it as any);

describe('ListMonthsTool', () => {
  let tool: ListMonthsTool;
  let getMonthsMock: any;

  const mockMonths = [
    {
      month: '2024-01-01',
      note: 'Start of year',
      income: 100000,
      budgeted: 80000,
      activity: -50000,
      to_be_budgeted: 20000,
      age_of_money: 30,
    },
    {
      month: '2024-02-01',
      note: '',
      income: 120000,
      budgeted: 90000,
      activity: -60000,
      to_be_budgeted: 30000,
      age_of_money: 32,
    },
  ];

  beforeEach(() => {
    tool = new ListMonthsTool();
    // @ts-ignore
    getMonthsMock = tool.api.months.getMonths;
    getMonthsMock.mockReset();
  });

  it('returns months for a valid budget', async () => {
    getMonthsMock.mockResolvedValue({ data: { months: mockMonths } });
    const result = await tool.execute({ budgetId: 'budget-1' });
    expect(result).toEqual([
      {
        month: '2024-01-01',
        note: 'Start of year',
        income: 100,
        budgeted: 80,
        activity: -50,
        to_be_budgeted: 20,
        age_of_money: 30,
      },
      {
        month: '2024-02-01',
        note: '',
        income: 120,
        budgeted: 90,
        activity: -60,
        to_be_budgeted: 30,
        age_of_money: 32,
      },
    ]);
  });

  it('returns error if no budgetId is provided and env is empty', async () => {
    // @ts-ignore
    tool.budgetId = '';
    const result = await tool.execute({});
    expect(result).toMatch(/No budget ID provided/);
  });

  it('handles API errors gracefully', async () => {
    getMonthsMock.mockRejectedValue(new Error('API failure'));
    const result = await tool.execute({ budgetId: 'budget-1' });
    expect(result).toMatch(/Error listing months/);
  });

  it("validates schema for required budgetId", () => {
    const tool = new ListMonthsTool();
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(true);
    expect(schema.budgetId.type.safeParse("budget-123").success).toBe(true);
  });

  it("returns error for missing budgetId", async () => {
    const tool = new ListMonthsTool();
    const result = await tool.execute({} as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/budget ID/i);
  });

  itMutable("fetches months from the test budget", async () => {
    const tool = new ListMonthsTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) {
      throw new Error("Test budget ID not set");
    }
    const result = await tool.execute({ budgetId });
    expect(Array.isArray(result)).toBe(true);
    if ((result as any[]).length > 0) {
      expect((result as any[])[0]).toHaveProperty("month");
      expect((result as any[])[0]).toHaveProperty("income");
      expect((result as any[])[0]).toHaveProperty("budgeted");
    }
  });
}); 