// testUtils.ts
import * as ynab from "ynab";

export function getTestBudgetId(): string | undefined {
  return process.env.YNAB_TEST_BUDGET_ID;
}

export function shouldRunMutable(): boolean {
  return !!process.env.YNAB_TEST_BUDGET_ID;
}

export function skipIfNoTestBudgetId(itFn: typeof it) {
  return shouldRunMutable() ? itFn : itFn.skip;
}

// --- YNAB API helpers for test data management ---
// Only YNAB_TEST_BUDGET_ID is required. Tests will use the first available category and payee.
const api = new ynab.API(process.env.YNAB_API_TOKEN || "");

export async function createTestAccount(budgetId: string, name = "Test Account"): Promise<ynab.Account> {
  const accountData: ynab.SaveAccount = {
    name: name + " " + Date.now(),
    type: ynab.AccountType.Checking,
    balance: 0,
  };
  const resp = await api.accounts.createAccount(budgetId, { account: accountData });
  return resp.data.account;
}

export async function createTestTransaction(budgetId: string, accountId: string, categoryId: string, amount: number): Promise<ynab.TransactionDetail> {
  const txData: ynab.SaveTransactionWithOptionalFields = {
    account_id: accountId,
    date: new Date().toISOString().slice(0, 10),
    amount,
    category_id: categoryId,
    memo: "Integration Test Transaction",
    cleared: ynab.TransactionClearedStatus.Cleared,
    approved: true,
  };
  const resp = await api.transactions.createTransaction(budgetId, { transaction: txData });
  return resp.data.transaction!;
}

export async function deleteTestTransaction(budgetId: string, transactionId: string): Promise<void> {
  await api.transactions.deleteTransaction(budgetId, transactionId);
}

export async function getFirstCategory(budgetId: string): Promise<ynab.Category> {
  const resp = await api.categories.getCategories(budgetId);
  for (const group of resp.data.category_groups) {
    const found = group.categories.find(cat => !cat.deleted && !cat.hidden);
    if (found) return found;
  }
  throw new Error("No available category found in test budget");
}

export async function getFirstPayee(budgetId: string): Promise<ynab.Payee> {
  const resp = await api.payees.getPayees(budgetId);
  const found = resp.data.payees.find(payee => !payee.deleted);
  if (found) return found;
  throw new Error("No available payee found in test budget");
} 