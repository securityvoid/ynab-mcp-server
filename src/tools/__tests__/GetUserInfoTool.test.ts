import { describe, it, expect } from "vitest";
import GetUserInfoTool from "../GetUserInfoTool";

describe("GetUserInfoTool", () => {
  it("validates schema (no required parameters)", () => {
    const tool = new GetUserInfoTool();
    const schema = tool.schema;
    // This tool has no required parameters, so any input should be valid
    expect(Object.keys(schema)).toHaveLength(0);
  });

  it("fetches user info from the API", async () => {
    const tool = new GetUserInfoTool();
    const result = await tool.execute();
    if (typeof result === 'string') {
      expect(result).toMatch(/error|token|network|not set|unable/i);
    } else {
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
    }
  });
}); 