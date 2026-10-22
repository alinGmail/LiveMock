import { z } from "zod";

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
  .describe("Existing matcher/action id; omit to generate one");
const conditionsField = matcherConditionSchema
  .optional()
  .describe("LiveMock matcher condition; defaults to IS");

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
    value: z.string().describe('Request path, for example "/users/1"'),
  }),
  z.object({
    id: idField,
    type: z.literal("header"),
    conditions: conditionsField,
    name: z.string().describe("Header name"),
    value: z.string().optional().describe("Header value"),
  }),
  z.object({
    id: idField,
    type: z.literal("query"),
    conditions: conditionsField,
    name: z.string().describe("Query parameter name"),
    value: z.string().optional().describe("Query parameter value"),
  }),
  z.object({
    id: idField,
    type: z.literal("param"),
    conditions: conditionsField,
    name: z.string().describe("Request body parameter name"),
    value: z.string().optional().describe("Request body parameter value"),
  }),
]);

const headersField = z
  .array(z.tuple([z.string(), z.string()]))
  .optional()
  .describe('Header name/value pairs, for example [["content-type", "application/json"]]');

export const actionSchema = z.discriminatedUnion("type", [
  z.object({
    id: idField,
    type: z.literal("CUSTOM_RESPONSE"),
    status: z.number().int().min(100).max(599).optional(),
    responseContent: z
      .object({
        type: z.enum(["JSON", "TEXT"]).optional(),
        value: z
          .string()
          .optional()
          .describe(
            "Response body text. For JSON, pass a stringified JSON document."
          ),
        headers: headersField,
        contentHandler: z.enum(["NONE", "MOCK_JS"]).optional(),
      })
      .optional(),
  }),
  z.object({
    id: idField,
    type: z.literal("PROXY"),
    protocol: z.enum(["http", "https"]).optional(),
    host: z.string().describe('Upstream host, for example "http://api.local"'),
    handleCross: z.boolean().optional(),
    crossAllowCredentials: z.boolean().optional(),
    supportWebsocket: z.boolean().optional(),
    pathRewrite: z
      .array(z.object({ type: z.string(), value: z.string() }))
      .optional(),
    prefixRemove: z.string().nullable().optional(),
    headers: headersField,
    requestHeaders: headersField,
  }),
  z.object({
    id: idField,
    type: z.literal("STATIC_DIRECTORY"),
    folderPath: z.string().describe("Absolute or relative directory path"),
    urlPrefix: z.string().optional(),
  }),
]);

export const expectationSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  delay: z.number().int().min(0).optional(),
  priority: z.number().int().optional(),
  activate: z.boolean().optional(),
  groupId: z.string().nullable().optional(),
  matchers: z
    .array(matcherSchema)
    .optional()
    .describe("All matchers must match for the expectation to fire"),
  actions: z
    .array(actionSchema)
    .optional()
    .describe("Actions run in order when the expectation matches"),
});

export type MatcherInput = z.infer<typeof matcherSchema>;
export type ActionInput = z.infer<typeof actionSchema>;
export type ExpectationInput = z.infer<typeof expectationSchema>;
