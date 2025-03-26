// Mock fs promises
vi.mock("fs", () => {
  return {
    promises: {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn(),
    },
  };
});

// Mock environment variables
const env = {
  KNOWLEDGE_DIR: "test-data",
  BUDGET_ID: "test-budget-id",
};

vi.stubEnv("KNOWLEDGE_DIR", env.KNOWLEDGE_DIR);
vi.stubEnv("BUDGET_ID", env.BUDGET_ID);

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import Knowledge from "../knowledge";
import * as ynab from "ynab";

describe("Knowledge", () => {
  let knowledge: Knowledge;

  beforeEach(async () => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Set default mock for readFile to simulate no existing file
    (fs.readFile as any).mockRejectedValue({ code: "ENOENT" });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("initialization", () => {
    it("should create a new storage file if none exists", async () => {
      // Reset knowledge instance and mock readFile to throw ENOENT
      (fs.readFile as any).mockRejectedValueOnce({ code: "ENOENT" });
      knowledge = new Knowledge();
      await knowledge.initialize();

      expect(fs.mkdir).toHaveBeenCalledWith("test-data", { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join("test-data", "server-knowledge.json"),
        JSON.stringify({
          last_knowledge_of_server: 0,
          default_budget_id: "test-budget-id",
          budgets: {},
        }),
        "utf8"
      );
    });

    it("should load existing data if storage file exists", async () => {
      const mockData = {
        last_knowledge_of_server: 123,
        default_budget_id: "existing-budget",
        budgets: {},
      };

      (fs.readFile as any).mockResolvedValueOnce(JSON.stringify(mockData));
      knowledge = new Knowledge();
      await knowledge.initialize();

      expect(fs.mkdir).toHaveBeenCalledWith("test-data", { recursive: true });
      expect(knowledge.getLastKnowledgeOfServer()).toBe(123);
    });
  });

  describe("budget operations", () => {
    beforeEach(async () => {
      knowledge = new Knowledge();
      await knowledge.initialize();
    });

    it("should set default budget ID and save", async () => {
      const budgetId = "test-budget-123";
      knowledge.setDefaultBudgetId(budgetId);

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join("test-data", "server-knowledge.json"),
        expect.stringContaining(budgetId),
        "utf8"
      );
    });

    it("should update and retrieve accounts", async () => {
      const budgetId = "test-budget";
      const mockAccount: ynab.Account = {
        id: "account-123",
        name: "Test Account",
        type: "checking",
        on_budget: true,
        closed: false,
        balance: 1000,
        cleared_balance: 1000,
        uncleared_balance: 0,
        transfer_payee_id: null,
        direct_import_linked: false,
        direct_import_in_error: false,
        deleted: false,
      };

      knowledge.updateAccounts(budgetId, [mockAccount]);
      const accounts = knowledge.getAccounts(budgetId);

      expect(accounts).toBeDefined();
      expect(accounts).toEqual([mockAccount]);
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join("test-data", "server-knowledge.json"),
        expect.stringContaining(mockAccount.id),
        "utf8"
      );
    });

    it("should update last knowledge of server", async () => {
      const serverKnowledge = 12345;
      await knowledge.updateLastKnowledgeOfServer(serverKnowledge);

      expect(knowledge.getLastKnowledgeOfServer()).toBe(serverKnowledge);
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join("test-data", "server-knowledge.json"),
        expect.stringContaining(serverKnowledge.toString()),
        "utf8"
      );
    });
  });
});
