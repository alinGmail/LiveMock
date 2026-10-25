import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LiveMockClient } from "../client.js";
import { stripInternal, summarizeLog } from "../domain.js";
import { projectRefSchema } from "../schemas.js";
import { LogFilterInput } from "../types.js";
import { resolveProject, run } from "./helpers.js";

const multiString = z.union([z.string(), z.array(z.string())]);
const statusValue = z.union([z.number().int(), z.string()]);
const multiStatus = z.union([statusValue, z.array(statusValue)]);
const timeValue = z.union([z.number().int(), z.string()]);

const logFilterCondition = z.enum([
  "EQUAL",
  "NOT_EQUAL",
  "CONTAINS",
  "GREATER",
  "LESS",
  "IN",
  "FAMILY",
]);

const logFilterValue = z.union([
  z.string(),
  z.number(),
  z.array(z.union([z.string(), z.number()])),
]);

const logFilterSchema = z.object({
  type: z
    .enum(["SIMPLE_FILTER", "PRESET_FILTER"])
    .optional()
    .describe("Filter type; defaults to SIMPLE_FILTER."),
  property: z
    .string()
    .describe(
      "Dot path into the log, for example req.headers.authorization, req.query.id, res.status or expectationId."
    ),
  condition: logFilterCondition.describe(
    "Comparison to apply. Use FAMILY for status families and IN for a list of exact values."
  ),
  value: logFilterValue.describe(
    "Compared value, or an array for IN and FAMILY."
  ),
  activate: z
    .boolean()
    .optional()
    .describe("Set false to skip this filter; defaults to true."),
  id: z
    .string()
    .optional()
    .describe("Ignored; accepted so a saved log-view filter can be reused."),
  name: z
    .string()
    .optional()
    .describe("Ignored; accepted for PRESET_FILTER-shaped objects."),
});

export function registerLogTools(server: McpServer, client: LiveMockClient) {
  server.registerTool(
    "list_logs",
    {
      title: "List LiveMock request logs",
      description:
        "List request logs for a project, newest first, as compact summaries. Filters are ANDed; pass an array for one filter to match any of several values. Filters are ad-hoc and do not change saved log views in the web UI. Bodies are omitted unless includeBody=true. Page backwards with maxLogId; the response includes hasMore. Logs cover traffic on the project's mock listener, not the LiveMock control API.",
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
        method: multiString
          .optional()
          .describe(
            "HTTP method(s), case-insensitive. Pass an array to match any of several methods."
          ),
        path: multiString
          .optional()
          .describe(
            "Exact URL path, query string excluded. Pass an array to match any of several paths."
          ),
        pathContains: multiString
          .optional()
          .describe(
            "Case-sensitive URL path substring. Pass an array to match any substring."
          ),
        status: multiStatus
          .optional()
          .describe(
            "Exact HTTP status code(s) or family tokens such as '2xx'. Pass an array to match any of several."
          ),
        expectationId: multiString
          .optional()
          .describe(
            "Id of the expectation that matched. Pass an array to match any of several."
          ),
        since: timeValue
          .optional()
          .describe(
            "Only logs requested at or after this time, as epoch milliseconds or an ISO-8601 timestamp."
          ),
        until: timeValue
          .optional()
          .describe(
            "Only logs requested before this time, as epoch milliseconds or an ISO-8601 timestamp."
          ),
        includeBody: z
          .boolean()
          .optional()
          .describe("Include request and response bodies in each summary"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({
      project,
      limit,
      maxLogId,
      method,
      path,
      pathContains,
      status,
      expectationId,
      since,
      until,
      includeBody,
    }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        const result = await client.queryLogs(resolved.id, {
          limit: limit ?? 20,
          maxLogId,
          method,
          path,
          pathContains,
          status,
          expectationId,
          since,
          until,
          includeBody,
        });
        return {
          logs: result.logs.map((log) =>
            summarizeLog(log, includeBody ?? false)
          ),
          hasMore: result.hasMore,
        };
      })
  );

  server.registerTool(
    "filter_logs",
    {
      title: "Filter LiveMock request logs",
      description:
        "Advanced ad-hoc request log query using the same filter objects as saved log views. Filters are ANDed and evaluated without reading or writing saved log views. Use this for header, query or body properties, or conditions such as NOT_EQUAL / GREATER; prefer list_logs for method, path, status, expectationId or time. GROUP_FILTER is not supported. Bodies are omitted unless includeBody=true; page backwards with maxLogId and check hasMore.",
      inputSchema: {
        project: projectRefSchema,
        filters: z
          .array(logFilterSchema)
          .min(1)
          .max(50)
          .describe(
            "View-shaped filters to AND together. A filter with activate=false is skipped."
          ),
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
          .describe(
            "Return entries older than this log id (the oldest id in the current page)"
          ),
        includeBody: z
          .boolean()
          .optional()
          .describe("Include request and response bodies in each summary"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ project, filters, limit, maxLogId, includeBody }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        const result = await client.queryLogsByFilters(resolved.id, {
          filters: filters as Array<LogFilterInput>,
          limit: limit ?? 20,
          maxLogId,
          includeBody,
        });
        return {
          logs: result.logs.map((log) =>
            summarizeLog(log, includeBody ?? false)
          ),
          hasMore: result.hasMore,
        };
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
