import { promises as fs } from 'fs';
import path from 'path';
import { logger } from 'mcp-framework';
import * as ynab from 'ynab';
import { TransactionDetail, Account, Category } from 'ynab';
type KnowledgeStore = {
  last_knowledge_of_server?: number;
  default_budget_id?: string;
  budgets?: {
    [budgetId: string]: {
      accounts?: Account[];
      categories?: Category[];
      transactions?: TransactionDetail[];
    };
  };
};

class Knowledge {
  private readonly dataDir = process.env.KNOWLEDGE_DIR || 'data';
  private readonly storageFile = 'server-knowledge.json';
  private initialStore: KnowledgeStore = {
    last_knowledge_of_server: 0,
    default_budget_id: process.env.BUDGET_ID || '',
    budgets: {}
  };

  private store: KnowledgeStore = this.initialStore;
  private filestoreEnabled: boolean = false;

  constructor() {
    this.initialize();
  }

  async initialize() {
    try {
      // Ensure data directory exists
      await fs.mkdir(this.dataDir, { recursive: true });

      // Try to load existing data
      try {
        const data = await fs.readFile(
          path.join(this.dataDir, this.storageFile),
          "utf8"
        );
        this.store = JSON.parse(data);
        this.filestoreEnabled = true;
        logger.info("Loaded existing server knowledge from storage");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          // File doesn't exist yet, that's fine
          this.filestoreEnabled = true;
          await this.save();
          logger.info("Created new server knowledge storage file");
        } else {
          logger.error(`Error loading server knowledge: ${error}`);
        }
      }
    } catch (error) {
      logger.error(`Error initializing storage: ${error}`);
      this.filestoreEnabled = false;
    }
  }

  async save() {
    if (!this.filestoreEnabled) {
      logger.info("Filestore is disabled, skipping save");
      return;
    }
    try {
      await fs.writeFile(
        path.join(this.dataDir, this.storageFile),
        JSON.stringify(this.store),
        "utf8"
      );
      logger.info("Saved server knowledge to storage");
    } catch (error) {
      logger.error(`Error saving server knowledge: ${error}`);
    }
  }

  reset() {
    this.store = this.initialStore;
    this.save();
  }

  setDefaultBudgetId(budgetId: string) {
    this.store.default_budget_id = budgetId;
    this.save();
  }

  getDefaultBudgetId() {
    return this.store.default_budget_id;
  }

  getAccounts(budgetId: string) {
    return this.store.budgets?.[budgetId]?.accounts;
  }

  getCategories(budgetId: string) {
    return this.store.budgets?.[budgetId]?.categories;
  }

  getTransactions(budgetId: string) {
    return this.store.budgets?.[budgetId]?.transactions;
  }

  getLastKnowledgeOfServer() {
    return this.store.last_knowledge_of_server;
  }

  getBudgets() {
    return this.store.budgets;
  }

  updateAccounts(budgetId: string, accounts: Account[]) {
    if (!this.store.budgets) {
      this.store.budgets = {};
    }
    if (!this.store.budgets[budgetId]) {
      this.store.budgets[budgetId] = {};
    }

    this.store.budgets[budgetId].accounts = accounts;
    this.save();
  }

  updateCategories(budgetId: string, categories: Category[]) {
    if (!this.store.budgets) {
      this.store.budgets = {};
    }
    if (!this.store.budgets[budgetId]) {
      this.store.budgets[budgetId] = {};
    }

    this.store.budgets[budgetId].categories = categories;
    this.save();
  }

  updateTransactions(budgetId: string, transactions: TransactionDetail[]) {
    if (!this.store.budgets) {
      this.store.budgets = {};
    }
    if (!this.store.budgets[budgetId]) {
      this.store.budgets[budgetId] = {};
    }

    this.store.budgets[budgetId].transactions = transactions;
    this.save();
  }

  updateLastKnowledgeOfServer(serverKnowledge: number) {
    this.store.last_knowledge_of_server = serverKnowledge;
    this.save();
  }
}

export default Knowledge;
