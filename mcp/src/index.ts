#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { LiveMockClient } from "./client.js";
import { loadConfig } from "./config.js";
import { buildInstructions } from "./instructions.js";
import { registerExpectationTools } from "./tools/expectations.js";
import { registerGroupTools } from "./tools/groups.js";
import { registerImportTool } from "./tools/import.js";
import { registerLogTools } from "./tools/logs.js";
import { registerLogViewTools } from "./tools/logView.js";
import { registerProjectTools } from "./tools/projects.js";

export const VERSION = "0.1.0";

async function main() {
  const config = loadConfig();
  const client = new LiveMockClient(config.baseUrl, config.token);
  const server = new McpServer(
    { name: "livemock", version: VERSION },
    { instructions: buildInstructions(config.readOnly) }
  );

  const writable = !config.readOnly;
  registerProjectTools(server, client, config.baseUrl, writable);
  registerExpectationTools(server, client, writable);
  registerGroupTools(server, client, writable);
  registerLogTools(server, client);
  registerLogViewTools(server, client, writable);
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
