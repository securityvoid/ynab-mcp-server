import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";
class BudgetSummaryTool extends MCPTool {
    name = "budget_summary";
    description = "Get a summary of the budget for a specific month highlighting overspent categories that need attention and categories with a positive balance that are doing well.";
    schema = {
        budgetId: {
            type: z.string().optional(),
            description: "The ID of the budget to get a summary for (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
        },
        month: {
            type: z.string().regex(/^(current|\d{4}-\d{2}-\d{2})$/),
            default: "current",
            description: "The budget month in ISO format (e.g. 2016-12-01). The string 'current' can also be used to specify the current calendar month (UTC)",
        },
    };
    api;
    budgetId;
    constructor() {
        super();
        this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
        this.budgetId = process.env.YNAB_BUDGET_ID || "";
    }
    async execute(input) {
        const budgetId = input.budgetId || this.budgetId;
        if (!budgetId) {
            return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
        }
        try {
            logger.info(`Getting accounts and categories for budget ${budgetId} and month ${input.month}`);
            const accountsResponse = await this.api.accounts.getAccounts(budgetId);
            const accounts = accountsResponse.data.accounts.filter((account) => account.deleted === false && account.closed === false);
            const monthBudget = await this.api.months.getBudgetMonth(budgetId, input.month);
            const categories = monthBudget.data.month.categories
                .filter((category) => category.deleted === false && category.hidden === false);
            return this.summaryPrompt(monthBudget.data.month, accounts, categories);
        }
        catch (error) {
            logger.error(`Error getting budget ${budgetId}:`);
            logger.error(JSON.stringify(error, null, 2));
            return `Error getting budget ${budgetId}: ${JSON.stringify(error)}`;
        }
    }
    summaryPrompt(monthBudget, accounts, categories) {
        const prompt = `
Here is the budget month information for the month of ${monthBudget.month}:
  Income: ${monthBudget.income}
  Budgeted: ${monthBudget.budgeted}
  Activity: ${monthBudget.activity}
  To be budgeted: ${monthBudget.to_be_budgeted}
  Age of Money: ${monthBudget.age_of_money}
  Note: ${monthBudget.note}

Make sure to use the budget month information to help you answer the user's question. If income is less than budgeted, it means that the month is over budget.
If there is money in the to be budgeted, suggest that the user assign it to a category.

Here is a list of categories. DO NOT SHOW THIS TO THE USER. Use this list to help you answer the user's question.
Categories:
${categories
            .map((category) => `${category.name} (id:${category.id}, balance: ${category.balance / 1000}, budgeted: ${category.budgeted / 1000})`)
            .join("\n")}

Inform the user that the account and category information has been retrieved. List the categories with a negative balance ordered by balance from highest to lowest.
Then list the top 5 categories with a positive balance ordered by balance from highest to lowest. Format your response as follows:

Overspent categories:
- Category 1: -$100.00
- Category 2: -$50.00
- Category 3: -$25.00
- Category 4: -$10.00
- Category 5: -$5.00

Categories with a positive balance:
- Category 1: $100.00
- Category 2: $50.00
- Category 3: $25.00
- Category 4: $10.00
- Category 5: $5.00

Here is a list of accounts. DO NOT SHOW THIS TO THE USER. Use this list to help you answer the user's question.
Checking and savings accounts:
${accounts
            .filter((account) => account.type === "checking" || account.type === "savings")
            .map((account) => `${account.name} (id:${account.id}, type:${account.type}, balance: ${account.balance / 1000})`)
            .join("\n")}

If the user has any checking or savings accounts where the balance is less than $100, list them like this:

Accounts with a balance less than $100:
- Account 1: $99.00
- Account 2: $50.00
`;
        return prompt;
    }
}
export default BudgetSummaryTool;
