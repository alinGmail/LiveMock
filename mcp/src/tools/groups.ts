import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LiveMockClient } from "../client.js";
import {
  normalizeGroup,
  normalizeGroupUpdate,
  stripInternal,
} from "../domain.js";
import { projectRefSchema } from "../schemas.js";
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
        "List a project's expectation groups with name, activation, priority and creation time. A group is ranked as one block in match order; an ungrouped expectation is a block of its own, and an inactive group disables all its member expectations.",
      inputSchema: {
        project: projectRefSchema,
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
        "Create an empty expectation group. Names are unique per project. The group's priority ranks the whole block against ungrouped expectations and other groups; a member's own priority only orders it inside this group. Assign expectations by setting their groupId.",
      inputSchema: {
        project: projectRefSchema,
        name: z.string().optional().describe("Group name, unique per project"),
        activate: z
          .boolean()
          .optional()
          .describe(
            "false disables the group and all its members; defaults to true"
          ),
        priority: z
          .number()
          .int()
          .optional()
          .describe(
            "Group block match precedence; higher is tried first; defaults to 0"
          ),
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
      description:
        "Update a group's name, activation or priority. Setting activate=false disables every expectation in the group without deleting it. Changing priority moves the whole block in match order; member priorities stay relative to each other.",
      inputSchema: {
        project: projectRefSchema,
        groupId: z.string().describe("Group id"),
        name: z.string().optional().describe("New group name"),
        activate: z
          .boolean()
          .optional()
          .describe("false disables the group and all its members"),
        priority: z
          .number()
          .int()
          .optional()
          .describe("New group block match precedence; higher is tried first"),
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
        project: projectRefSchema,
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
