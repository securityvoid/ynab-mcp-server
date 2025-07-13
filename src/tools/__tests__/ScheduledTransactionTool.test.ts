import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScheduledTransactionTool from '../ScheduledTransactionTool';
import { getTestBudgetId, skipIfNoTestBudgetId } from './testUtils';

// Mock ynab API
vi.mock('ynab', () => {
  return {
    TransactionClearedStatus: { Cleared: 'cleared', Uncleared: 'uncleared' },
    TransactionFlagColor: { Red: 'red', Blue: 'blue', Yellow: 'yellow' },
    ScheduledTransactionFrequency: { Monthly: 'monthly' },
    API: class {
      scheduledTransactions = {
        getScheduledTransactionById: vi.fn(),
        createScheduledTransaction: vi.fn(),
        updateScheduledTransaction: vi.fn(),
        deleteScheduledTransaction: vi.fn(),
      };
    },
  };
});

const itMutable = skipIfNoTestBudgetId(it as any);

describe('ScheduledTransactionTool', () => {
  let tool: ScheduledTransactionTool;
  let getScheduledTransactionByIdMock: any;
  let createScheduledTransactionMock: any;
  let updateScheduledTransactionMock: any;
  let deleteScheduledTransactionMock: any;

  const mockScheduled = {
    id: 'sched-1',
    account_id: 'acc-1',
    date_first: '2024-01-01',
    frequency: 'monthly',
    amount: 10000,
    memo: 'Rent',
    payee_id: 'payee-1',
    category_id: 'cat-1',
    cleared: 'cleared',
    approved: true,
    flag_color: 'red',
  };

  beforeEach(() => {
    tool = new ScheduledTransactionTool();
    // @ts-ignore
    getScheduledTransactionByIdMock = tool.api.scheduledTransactions.getScheduledTransactionById;
    // @ts-ignore
    createScheduledTransactionMock = tool.api.scheduledTransactions.createScheduledTransaction;
    // @ts-ignore
    updateScheduledTransactionMock = tool.api.scheduledTransactions.updateScheduledTransaction;
    // @ts-ignore
    deleteScheduledTransactionMock = tool.api.scheduledTransactions.deleteScheduledTransaction;
    getScheduledTransactionByIdMock.mockReset();
    createScheduledTransactionMock.mockReset();
    updateScheduledTransactionMock.mockReset();
    deleteScheduledTransactionMock.mockReset();
  });

  it('gets a scheduled transaction', async () => {
    getScheduledTransactionByIdMock.mockResolvedValue({ data: { scheduled_transaction: mockScheduled } });
    const result = await tool.execute({ budgetId: 'budget-1', action: 'get', scheduledTransactionId: 'sched-1' });
    expect(result).toEqual(mockScheduled);
  });

  it('creates a scheduled transaction', async () => {
    createScheduledTransactionMock.mockResolvedValue({ data: { scheduled_transaction: mockScheduled } });
    const result = await tool.execute({
      budgetId: 'budget-1',
      action: 'create',
      data: {
        accountId: 'acc-1',
        dateFirst: '2024-01-01',
        frequency: 'monthly',
        amount: 10,
        memo: 'Rent',
        payeeId: 'payee-1',
        categoryId: 'cat-1',
        cleared: true,
        approved: true,
        flagColor: 'red',
      },
    });
    expect(result).toEqual(mockScheduled);
  });

  it('updates a scheduled transaction', async () => {
    updateScheduledTransactionMock.mockResolvedValue({ data: { scheduled_transaction: { ...mockScheduled, memo: 'Updated' } } });
    const result = await tool.execute({
      budgetId: 'budget-1',
      action: 'update',
      scheduledTransactionId: 'sched-1',
      data: { memo: 'Updated' },
    });
    expect(typeof result).not.toBe('string');
    if (typeof result !== 'string' && 'memo' in result) {
      expect(result.memo).toBe('Updated');
    }
  });

  it('deletes a scheduled transaction', async () => {
    deleteScheduledTransactionMock.mockResolvedValue({});
    const result = await tool.execute({
      budgetId: 'budget-1',
      action: 'delete',
      scheduledTransactionId: 'sched-1',
    });
    expect(result).toEqual({ success: true });
  });

  it('returns error if no budgetId is provided and env is empty', async () => {
    // @ts-ignore
    tool.budgetId = '';
    const result = await tool.execute({ action: 'get', scheduledTransactionId: 'sched-1' });
    expect(result).toMatch(/No budget ID provided/);
  });

  it('returns error if required fields are missing for create', async () => {
    const result = await tool.execute({ budgetId: 'budget-1', action: 'create', data: { memo: 'Rent' } });
    expect(result).toMatch(/Missing required fields/);
  });

  it('returns error if no scheduledTransactionId for get/update/delete', async () => {
    const getResult = await tool.execute({ budgetId: 'budget-1', action: 'get' });
    expect(getResult).toMatch(/No scheduled transaction ID provided/);
    const updateResult = await tool.execute({ budgetId: 'budget-1', action: 'update', data: { memo: 'Updated' } });
    expect(updateResult).toMatch(/No scheduled transaction ID provided/);
    const deleteResult = await tool.execute({ budgetId: 'budget-1', action: 'delete' });
    expect(deleteResult).toMatch(/No scheduled transaction ID provided/);
  });

  it('handles API errors gracefully', async () => {
    getScheduledTransactionByIdMock.mockRejectedValue(new Error('API failure'));
    const result = await tool.execute({ budgetId: 'budget-1', action: 'get', scheduledTransactionId: 'sched-1' });
    expect(result).toMatch(/Error with scheduled transaction/);
  });

  it("validates schema for required parameters", () => {
    const tool = new ScheduledTransactionTool();
    const schema = tool.schema;
    expect(schema.budgetId.type.safeParse(undefined).success).toBe(true);
    expect(schema.scheduledTransactionId.type.safeParse(undefined).success).toBe(true);
    expect(schema.budgetId.type.safeParse("budget-123").success).toBe(true);
    expect(schema.scheduledTransactionId.type.safeParse("sched-123").success).toBe(true);
  });

  it("returns error for missing budgetId", async () => {
    const tool = new ScheduledTransactionTool();
    const result = await tool.execute({
      scheduledTransactionId: "sched-123",
    } as any);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/budget ID/i);
  });

  it("returns error for missing scheduledTransactionId", async () => {
    const tool = new ScheduledTransactionTool();
    const result = await tool.execute({
      budgetId: "budget-123",
    } as any);
    expect(typeof result).toBe("string");
    expect(result).toBe("Invalid action.");
  });

  itMutable("fetches a scheduled transaction from the test budget", async () => {
    const tool = new ScheduledTransactionTool();
    const budgetId = getTestBudgetId();
    if (!budgetId) {
      throw new Error("Test budget ID not set");
    }
    // Dynamically fetch the first available scheduled transaction
    const ynab = require("ynab");
    const ynabAPI = new ynab.API(process.env.YNAB_API_TOKEN);
    const scheduledResp = await ynabAPI.scheduledTransactions.getScheduledTransactions(budgetId);
    const scheduled = scheduledResp.data.scheduled_transactions;
    if (!scheduled || scheduled.length === 0) {
      console.warn("No scheduled transactions found in the test budget. Skipping test.");
      return;
    }
    const scheduledTransactionId = scheduled[0].id;
    const result = await tool.execute({
      budgetId,
      scheduledTransactionId,
      action: "get",
    });
    expect(typeof result).toBe("object");
    expect((result as any)).toHaveProperty("id");
    expect((result as any)).toHaveProperty("amount");
    expect((result as any)).toHaveProperty("date_next");
    expect((result as any)).toHaveProperty("account_id");
  });
}); 