import { z } from "zod";

export const logFilterCondition = z.enum([
  "EQUAL",
  "NOT_EQUAL",
  "CONTAINS",
  "GREATER",
  "LESS",
  "IN",
  "FAMILY",
]);

export const logFilterValue = z.union([
  z.string(),
  z.number(),
  z.array(z.union([z.string(), z.number()])),
]);

const logFilterPropertyDescription =
  "Dot path into the request log. Common fields: req.method, req.path, " +
  "req.headers.<name>, req.query.<name>, req.body.<field>, res.status, " +
  "res.duration, expectationId, req.requestTime. Examples: " +
  "req.headers.authorization, req.body.user.id.";

const logFilterConditionDescription = `Comparison operator.
- EQUAL: exact match; strings are case-sensitive and numeric strings match their number (for example "200" matches 200). Example: { "property": "req.method", "condition": "EQUAL", "value": "GET" }.
- NOT_EQUAL: value differs from the filter value.
- CONTAINS: substring match for strings. Example: { "property": "req.path", "condition": "CONTAINS", "value": "/users" }.
- GREATER / LESS: numeric or lexicographic comparison. For req.requestTime and res.responseTime use epoch milliseconds or ISO-8601. Example: { "property": "res.duration", "condition": "GREATER", "value": 1000 }.
- IN: value is one of the items in the array. Example: { "property": "req.method", "condition": "IN", "value": ["GET", "POST"] }.
- FAMILY: status-code family range, mainly for res.status. "2xx" means 200-299, "5xx" means 500-599; exact codes can be mixed in, e.g. ["4xx", 500] matches 400-499 or exactly 500. Example: { "property": "res.status", "condition": "FAMILY", "value": ["5xx"] }.`;

const logFilterValueDescription =
  "Filter value. Use a scalar for EQUAL, NOT_EQUAL, CONTAINS, GREATER and " +
  "LESS, and an array for IN and FAMILY. FAMILY accepts family tokens such " +
  'as "2xx" plus exact codes, e.g. ["4xx", 500]. Time fields ' +
  "(req.requestTime, res.responseTime) accept epoch milliseconds or " +
  'ISO-8601 timestamps. Examples: "GET", 200, ["2xx", "500"], ' +
  '"2026-01-01T00:00:00Z".';

const logFilterProperty = z
  .string()
  .refine(
    (value) =>
      value.trim() !== "" && !value.trim().startsWith("$"),
    "property must be a non-empty dot path that does not start with $"
  )
  .describe(logFilterPropertyDescription);

const logFilterConditionSchema = logFilterCondition.describe(
  logFilterConditionDescription
);
const logFilterValueSchema = logFilterValue.describe(
  logFilterValueDescription
);

export const logFilterSchema = z.object({
  type: z
    .enum(["SIMPLE_FILTER", "PRESET_FILTER"])
    .optional()
    .describe("Filter type; defaults to SIMPLE_FILTER."),
  property: z.string().describe(logFilterPropertyDescription),
  condition: logFilterConditionSchema,
  value: logFilterValueSchema,
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

export const presetName = z
  .enum(["EXPECTATION", "METHODS", "STATUS_CODE"])
  .describe(
    "Preset to set: EXPECTATION takes an expectation id, METHODS takes HTTP methods, STATUS_CODE takes status families or exact codes."
  );

export const presetValue = z
  .union([
    z.string(),
    z.array(z.union([z.string(), z.number()])),
    z.null(),
  ])
  .describe(
    'EXPECTATION accepts an expectation id string; METHODS and STATUS_CODE accept arrays such as ["GET", "POST"] or ["4xx", 500]. An empty string, null or empty array removes the preset.'
  );

export const simpleFilterInputSchema = z.object({
  type: z
    .enum(["SIMPLE_FILTER"])
    .optional()
    .describe("Must be SIMPLE_FILTER when supplied."),
  id: z
    .string()
    .optional()
    .describe("Optional id; the server generates one when omitted."),
  property: logFilterProperty,
  condition: logFilterConditionSchema,
  value: logFilterValueSchema,
  activate: z
    .boolean()
    .optional()
    .describe("Set false to store an inactive filter; defaults to true."),
});
