import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LiveMockClient } from "../client.js";
import {
  normalizeExpectation,
  normalizeExpectationUpdate,
  stripInternal,
  summarizeExpectation,
} from "../domain.js";
import { expectationSchema } from "../schemas.js";
import { resolveProject, run } from "./helpers.js";

const CREATE_EXAMPLE = `Typical custom JSON response:
{"project":"demo","expectation":{"name":"GET /users/1","description":"one user","activate":true,"priority":0,"delay":0,"matchers":[{"type":"method","conditions":"IS","value":"GET"},{"type":"path","conditions":"IS","value":"/users/1"}],"actions":[{"type":"CUSTOM_RESPONSE","status":200,"responseContent":{"type":"JSON","value":"{\\"id\\":1,\\"name\\":\\"Tom\\"}","headers":[["content-type","application/json"]]}}]}}

Proxy example:
{"project":"demo","expectation":{"name":"Proxy /api","matchers":[{"type":"path","conditions":"START_WITH","value":"/api/"}],"actions":[{"type":"PROXY","protocol":"http","host":"http://localhost:3000","pathRewrite":[]}]}}`;

export function registerExpectationTools(
  server: McpServer,
  client: LiveMockClient,
  writable = true
) {
  server.registerTool(
    "list_expectations",
    {
      title: "List LiveMock expectations",
      description:
        "List a project's expectations as compact summaries. Use full=true to return the raw matchers and actions.",
      inputSchema: {
        project: z.string().describe("Project id or exact project name"),
        full: z
          .boolean()
          .optional()
          .describe("Return the raw expectation objects instead of summaries"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ project, full }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        const expectations = await client.listExpectations(resolved.id);
        return full
          ? expectations.map(stripInternal)
          : expectations.map((expectation) =>
              summarizeExpectation(expectation)
            );
      })
  );

  server.registerTool(
    "get_expectation",
    {
      title: "Get a LiveMock expectation",
      description:
        "Get one expectation by id, including its full matchers and actions.",
      inputSchema: {
        project: z.string().describe("Project id or exact project name"),
        expectationId: z.string().describe("Expectation id"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ project, expectationId }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        return stripInternal(
          await client.getExpectation(resolved.id, expectationId)
        );
      })
  );

  if (!writable) {
    return;
  }

  server.registerTool(
    "create_expectation",
    {
      title: "Create a LiveMock expectation",
      description:
        "Create an expectation from raw LiveMock matchers and actions. " +
        "Matchers and actions use LiveMock's native shapes; missing ids, matcher conditions and response-object fields are filled with defaults. " +
        CREATE_EXAMPLE,
      inputSchema: {
        project: z.string().describe("Project id or exact project name"),
        expectation: expectationSchema,
      },
    },
    async ({ project, expectation }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        const created = await client.createExpectation(
          resolved.id,
          normalizeExpectation(expectation)
        );
        const result: Record<string, unknown> = { ...stripInternal(created) };
        if (resolved.status !== "STARTED") {
          result.hint = `Project "${resolved.name}" is ${resolved.status}; call start_project to make this expectation live.`;
        }
        return result;
      })
  );

  server.registerTool(
    "update_expectation",
    {
      title: "Update a LiveMock expectation",
      description:
        "Update an expectation with a raw partial payload. Only the fields you provide are changed.",
      inputSchema: {
        project: z.string().describe("Project id or exact project name"),
        expectationId: z.string().describe("Expectation id"),
        expectationUpdate: expectationSchema,
      },
    },
    async ({ project, expectationId, expectationUpdate }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        const update = normalizeExpectationUpdate(expectationUpdate);
        if (Object.keys(update).length === 0) {
          throw new Error("No expectation fields were provided to update.");
        }
        return stripInternal(
          await client.updateExpectation(resolved.id, expectationId, update)
        );
      })
  );

  server.registerTool(
    "delete_expectation",
    {
      title: "Delete a LiveMock expectation",
      description: "Delete an expectation by id. This cannot be undone.",
      inputSchema: {
        project: z.string().describe("Project id or exact project name"),
        expectationId: z.string().describe("Expectation id"),
      },
      annotations: { destructiveHint: true },
    },
    async ({ project, expectationId }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        await client.deleteExpectation(resolved.id, expectationId);
        return {
          message: "expectation deleted",
          projectId: resolved.id,
          expectationId,
        };
      })
  );
}
