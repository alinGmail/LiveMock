#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { LiveMockClient } from "./client.js";
import { loadConfig } from "./config.js";
import { registerExpectationTools } from "./tools/expectations.js";
import { registerGroupTools } from "./tools/groups.js";
import { registerImportTool } from "./tools/import.js";
import { registerLogTools } from "./tools/logs.js";
import { registerProjectTools } from "./tools/projects.js";

export const VERSION = "0.1.0";

async function main() {
  const config = loadConfig();
  const client = new LiveMockClient(config.baseUrl, config.token);
  const server = new McpServer(
    { name: "livemock", version: VERSION },
    {
      instructions:
        "Manage a running LiveMock web instance. Resolve projects by id or exact name. " +
        "Expectations use LiveMock's raw matchers and actions; call start_project after creating mocks.",
    }
  );

  const writable = !config.readOnly;
  registerProjectTools(server, client, config.baseUrl, writable);
  registerExpectationTools(server, client, writable);
  registerGroupTools(server, client, writable);
  registerLogTools(server, client);
  registerImportTool(server, client, writable);

  console.error(
    `[livemock-mcp] connecting to ${config.baseUrl}${
      config.readOnly ? " (read-only tools)" : ""
    }`
  );
  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  console.error("[livemock-mcp] failed to start:", error);
  process.exit(1);
});
