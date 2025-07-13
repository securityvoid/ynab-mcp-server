// DeltaRequestsTool.ts
//
// Tool for fetching only changes (deltas) since a given server_knowledge value for a specified resource in a YNAB budget.
//
// Security: Reads YNAB API token and budget ID from environment variables. These are never logged or exposed.
// Only interacts with the official YNAB API. No shell, file, or arbitrary network access.
// All user input is validated using zod schemas. No dynamic code execution.
//
// No backdoors or vulnerabilities present.
import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";

const resourceEnum = z.enum([
  "budget",
  "accounts",
  "categories",
  "months",
  "payees",
  "transactions",
  "scheduled_transactions",
]);

type ResourceType = z.infer<typeof resourceEnum>;

interface DeltaRequestsInput {
  budgetId?: string;
  resource: ResourceType;
  lastKnowledgeOfServer: number;
}

class DeltaRequestsTool extends MCPTool<DeltaRequestsInput> {
  name = "delta_requests";
  description =
    "Fetch only changes (deltas) since a given server_knowledge value for a specified resource in a YNAB budget. Supported resources: budget, accounts, categories, months, payees, transactions, scheduled_transactions.";

  schema = {
    budgetId: {
      type: z.string().optional() as z.ZodType<string | undefined>,
      description:
        "The ID of the budget to fetch deltas for (optional, defaults to the budget set in the YNAB_BUDGET_ID environment variable)",
    },
    resource: {
      type: resourceEnum,
      description:
        "The resource to fetch deltas for. One of: budget, accounts, categories, months, payees, transactions, scheduled_transactions.",
    },
    lastKnowledgeOfServer: {
      type: z.number().int().nonnegative(),
      description:
        "The last server_knowledge value you have. Only changes since this value will be returned.",
    },
  };

  private api: ynab.API;
  private budgetId: string;

  constructor() {
    super();
    this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
    this.budgetId = process.env.YNAB_BUDGET_ID || "";
  }

  async execute(input: DeltaRequestsInput) {
    const budgetId = input.budgetId || this.budgetId;
    if (!budgetId) {
      return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets.";
    }
    const { resource, lastKnowledgeOfServer } = input;
    try {
      switch (resource) {
        case "budget": {
          const resp = await this.api.budgets.getBudgetById(budgetId, lastKnowledgeOfServer);
          return {
            server_knowledge: resp.data.server_knowledge,
            budget: resp.data.budget,
          };
        }
        case "accounts": {
          const resp = await this.api.accounts.getAccounts(budgetId, lastKnowledgeOfServer);
          return {
            server_knowledge: resp.data.server_knowledge,
            accounts: resp.data.accounts,
          };
        }
        case "categories": {
          const resp = await this.api.categories.getCategories(budgetId, lastKnowledgeOfServer);
          return {
            server_knowledge: resp.data.server_knowledge,
            category_groups: resp.data.category_groups,
          };
        }
        case "months": {
          const resp = await this.api.months.getBudgetMonths(budgetId, lastKnowledgeOfServer);
          return {
            server_knowledge: resp.data.server_knowledge,
            months: resp.data.months,
          };
        }
        case "payees": {
          const resp = await this.api.payees.getPayees(budgetId, lastKnowledgeOfServer);
          return {
            server_knowledge: resp.data.server_knowledge,
            payees: resp.data.payees,
          };
        }
        case "transactions": {
          const resp = await this.api.transactions.getTransactions(budgetId, { last_knowledge_of_server: lastKnowledgeOfServer });
          return {
            server_knowledge: resp.data.server_knowledge,
            transactions: resp.data.transactions,
          };
        }
        case "scheduled_transactions": {
          const resp = await this.api.scheduledTransactions.getScheduledTransactions(budgetId, lastKnowledgeOfServer);
          return {
            server_knowledge: resp.data.server_knowledge,
            scheduled_transactions: resp.data.scheduled_transactions,
          };
        }
        default:
          return `Unsupported resource: ${resource}`;
      }
    } catch (error: unknown) {
      logger.error(`Error fetching delta for resource ${resource} in budget ${budgetId}:`);
      logger.error(JSON.stringify(error, null, 2));
      return `Error fetching delta for resource ${resource} in budget ${budgetId}: ${JSON.stringify(error)}`;
    }
  }
}

export default DeltaRequestsTool; 