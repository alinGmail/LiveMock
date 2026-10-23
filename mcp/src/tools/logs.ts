import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LiveMockClient } from "../client.js";
import { stripInternal, summarizeLog } from "../domain.js";
import { projectRefSchema } from "../schemas.js";
import { resolveProject, run } from "./helpers.js";

export function registerLogTools(server: McpServer, client: LiveMockClient) {
  server.registerTool(
    "list_logs",
    {
      title: "List LiveMock request logs",
      description:
        "List recent request logs for a project, newest first, as compact summaries. Bodies are omitted unless includeBody=true. Page backwards with maxLogId. Logs cover traffic on the project's mock listener, not the LiveMock control API.",
      inputSchema: {
        project: projectRefSchema,
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Number of entries to return; default 20, max 100"),
        maxLogId: z
          .number()
          .int()
          .optional()
          .describe("Return entries older than this log id (the oldest id in the current page)"),
        includeBody: z
          .boolean()
          .optional()
          .describe("Include request and response bodies in each summary"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ project, limit, maxLogId, includeBody }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        const logs = await client.listLogs(resolved.id, maxLogId);
        return logs
          .slice(0, limit ?? 20)
          .map((log) => summarizeLog(log, includeBody ?? false));
      })
  );

  server.registerTool(
    "get_log",
    {
      title: "Get a LiveMock request log",
      description:
        "Get one request log with full request and response headers, query, body and timing. The expectationId shows which rule matched.",
      inputSchema: {
        project: projectRefSchema,
        logId: z.number().int().describe("Request log id"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ project, logId }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        const result = await client.getLog(resolved.id, logId);
        return stripInternal(result.logItem);
      })
  );
}
