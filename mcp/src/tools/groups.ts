import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LiveMockClient } from "../client.js";
import {
  normalizeGroup,
  normalizeGroupUpdate,
  stripInternal,
} from "../domain.js";
import { resolveProject, run } from "./helpers.js";

export function registerGroupTools(
  server: McpServer,
  client: LiveMockClient,
  writable = true
) {
  server.registerTool(
    "list_groups",
    {
      title: "List LiveMock expectation groups",
      description:
        "List a project's expectation groups with name, activation, priority and creation time.",
      inputSchema: {
        project: z.string().describe("Project id or exact project name"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ project }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        const groups = await client.listGroups(resolved.id);
        return groups.map(stripInternal);
      })
  );

  if (!writable) {
    return;
  }

  server.registerTool(
    "create_group",
    {
      title: "Create a LiveMock expectation group",
      description:
        "Create a group. Names are unique per project; higher priority groups are matched first.",
      inputSchema: {
        project: z.string().describe("Project id or exact project name"),
        name: z.string().optional(),
        activate: z.boolean().optional(),
        priority: z.number().int().optional(),
      },
    },
    async ({ project, name, activate, priority }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        return stripInternal(
          await client.createGroup(
            resolved.id,
            normalizeGroup({ name, activate, priority })
          )
        );
      })
  );

  server.registerTool(
    "update_group",
    {
      title: "Update a LiveMock expectation group",
      description: "Update a group's name, activation or priority.",
      inputSchema: {
        project: z.string().describe("Project id or exact project name"),
        groupId: z.string().describe("Group id"),
        name: z.string().optional(),
        activate: z.boolean().optional(),
        priority: z.number().int().optional(),
      },
    },
    async ({ project, groupId, name, activate, priority }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        const update = normalizeGroupUpdate({ name, activate, priority });
        if (Object.keys(update).length === 0) {
          throw new Error("No group fields were provided to update.");
        }
        return stripInternal(
          await client.updateGroup(resolved.id, groupId, update)
        );
      })
  );

  server.registerTool(
    "delete_group",
    {
      title: "Delete a LiveMock expectation group",
      description:
        "Delete a group and every expectation in it. Request logs are kept. This cannot be undone.",
      inputSchema: {
        project: z.string().describe("Project id or exact project name"),
        groupId: z.string().describe("Group id"),
      },
      annotations: { destructiveHint: true },
    },
    async ({ project, groupId }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        const expectations = await client.listExpectations(resolved.id);
        const deletedExpectations = expectations.filter(
          (expectation) => expectation.groupId === groupId
        ).length;
        await client.deleteGroup(resolved.id, groupId);
        return {
          message: "group deleted",
          projectId: resolved.id,
          groupId,
          deletedExpectations,
        };
      })
  );
}
