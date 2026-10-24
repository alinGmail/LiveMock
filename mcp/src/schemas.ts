import { z } from "zod";

export const projectRefSchema = z
  .string()
  .describe("Project id or exact project name");

export const matcherConditionSchema = z.enum([
  "IS",
  "IS_NOT",
  "CONTAINS",
  "NOT_CONTAINS",
  "START_WITH",
  "END_WITH",
  "MATCH_REGEX",
  "NOT_MATCH_REGEX",
  "SHOWED",
  "NOT_SHOWED",
  "MATCH_GLOB",
  "NO_MATCH_GLOB",
]);

const idField = z
  .string()
  .optional()
  .describe(
    "Stable matcher/action id; omit on create to generate one. Preserve existing ids when updating."
  );
const conditionsField = matcherConditionSchema
  .optional()
  .describe(
    "How the actual value is compared. IS/IS_NOT exact; CONTAINS/NOT_CONTAINS substring; START_WITH/END_WITH prefix or suffix; MATCH_REGEX/NOT_MATCH_REGEX JavaScript regex (/pattern/flags accepted); MATCH_GLOB/NO_MATCH_GLOB micromatch glob; SHOWED/NOT_SHOWED presence, where value is ignored. Defaults to IS."
  );

export const matcherSchema = z.discriminatedUnion("type", [
  z.object({
    id: idField,
    type: z.literal("method"),
    conditions: conditionsField,
    value: z.string().describe('HTTP method, for example "GET"'),
  }),
  z.object({
    id: idField,
    type: z.literal("path"),
    conditions: conditionsField,
    value: z
      .string()
      .describe(
        'URL path without the query string, for example "/users/1"; match query parameters with a query matcher'
      ),
  }),
  z.object({
    id: idField,
    type: z.literal("header"),
    conditions: conditionsField,
    name: z.string().describe("Request header name"),
    value: z
      .string()
      .optional()
      .describe("Expected header value; omit for SHOWED/NOT_SHOWED"),
  }),
  z.object({
    id: idField,
    type: z.literal("query"),
    conditions: conditionsField,
    name: z
      .string()
      .describe(
        "Query parameter name, or a lodash-style path such as filter.name"
      ),
    value: z
      .string()
      .optional()
      .describe("Expected query value; omit for SHOWED/NOT_SHOWED"),
  }),
  z.object({
    id: idField,
    type: z.literal("param"),
    conditions: conditionsField,
    name: z
      .string()
      .describe(
        "Body field name or lodash-style path such as user.id; reads JSON, urlencoded or multipart bodies"
      ),
    value: z
      .string()
      .optional()
      .describe("Expected body value; omit for SHOWED/NOT_SHOWED"),
  }),
]);

const headersField = z
  .array(z.tuple([z.string(), z.string()]))
  .optional()
  .describe(
    'Header [name, value] pairs, for example [["content-type", "application/json"]]'
  );

export const actionSchema = z.discriminatedUnion("type", [
  z.object({
    id: idField,
    type: z.literal("CUSTOM_RESPONSE"),
    status: z
      .number()
      .int()
      .min(100)
      .max(599)
      .optional()
      .describe("HTTP status code; defaults to 200"),
    responseContent: z
      .object({
        type: z
          .enum(["JSON", "TEXT"])
          .optional()
          .describe("JSON sets application/json; TEXT sets text/plain"),
        value: z
          .string()
          .optional()
          .describe(
            "Response body as text. For JSON, pass a stringified JSON document, not an object. With MOCK_JS, pass a Mock.js JSON template."
          ),
        headers: headersField,
        contentHandler: z
          .enum(["NONE", "MOCK_JS"])
          .optional()
          .describe(
            "NONE sends value as-is; MOCK_JS generates the JSON body from the Mock.js template in value."
          ),
      })
      .optional()
      .describe("Response body and headers"),
  }),
  z.object({
    id: idField,
    type: z.literal("PROXY"),
    protocol: z
      .enum(["http", "https"])
      .optional()
      .describe("Upstream protocol; defaults to http"),
    host: z
      .string()
      .describe(
        'Upstream origin including protocol, for example "http://localhost:3000"'
      ),
    handleCross: z
      .boolean()
      .optional()
      .describe("Add CORS headers to the proxied response"),
    crossAllowCredentials: z
      .boolean()
      .optional()
      .describe(
        "Send Access-Control-Allow-Credentials when handleCross is enabled"
      ),
    supportWebsocket: z
      .boolean()
      .optional()
      .describe("Proxy WebSocket upgrade requests to the same upstream"),
    pathRewrite: z
      .array(z.object({ type: z.string(), value: z.string() }))
      .optional()
      .describe(
        "Path rewrite rules kept for compatibility; the current mock engine does not apply them. Use prefixRemove to strip a prefix."
      ),
    prefixRemove: z
      .string()
      .nullable()
      .optional()
      .describe(
        "Strip this prefix from the incoming path before forwarding; null keeps the path unchanged"
      ),
    headers: headersField.describe(
      "Response headers to add or replace on the proxied response"
    ),
    requestHeaders: headersField.describe(
      "Headers to send to the upstream server"
    ),
  }),
  z.object({
    id: idField,
    type: z.literal("STATIC_DIRECTORY"),
    folderPath: z
      .string()
      .describe(
        "Directory to serve; absolute, or relative to the LiveMock server working directory"
      ),
    urlPrefix: z
      .string()
      .optional()
      .describe("Serve files only under this URL prefix"),
  }),
]);

export const expectationSchema = z.object({
  name: z
    .string()
    .optional()
    .describe("Short label for the UI and logs; not used for matching"),
  description: z.string().optional().describe("Optional note for humans"),
  delay: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe(
      "Artificial delay in milliseconds before responding; 0 = immediate"
    ),
  priority: z
    .number()
    .int()
    .optional()
    .describe(
      "Match precedence; higher numbers are tried first, and a later-created rule wins a tie. For an ungrouped expectation this value ranks it against groups; for a grouped expectation the group's priority ranks the block and this value only orders members inside it."
    ),
  activate: z
    .boolean()
    .optional()
    .describe("false disables this expectation; defaults to true"),
  groupId: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Optional group id; null or omitted means ungrouped, so this expectation is its own match-order block ranked by its own priority and createTime. An inactive group disables its members."
    ),
  matchers: z
    .array(matcherSchema)
    .optional()
    .describe(
      "All matchers must match for the expectation to fire. Empty matches every request; normal rules include at least a method and path."
    ),
  actions: z
    .array(actionSchema)
    .optional()
    .describe(
      "Action to run on a match; LiveMock currently executes the first action. Order is preserved."
    ),
});

export type MatcherInput = z.infer<typeof matcherSchema>;
export type ActionInput = z.infer<typeof actionSchema>;
export type ExpectationInput = z.infer<typeof expectationSchema>;
