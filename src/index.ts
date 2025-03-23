import { MCPServer } from "mcp-framework";

const server = new MCPServer();

server.start();

// Handle shutdown
process.on("SIGINT", async () => {
  await server.stop();
});
