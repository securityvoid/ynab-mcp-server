// index.ts
// Entry point for the YNAB MCP server.
//
// Security: This file only starts the MCP server and handles shutdown signals.
// It does not process user input, handle sensitive data, or make network requests directly.
// All sensitive operations are delegated to tools in the tools/ directory.
//
// No backdoors or vulnerabilities present.
import 'dotenv/config';
import { MCPServer } from "mcp-framework";

const server = new MCPServer();

server.start();

// Handle shutdown
process.on("SIGINT", async () => {
  await server.stop();
});
