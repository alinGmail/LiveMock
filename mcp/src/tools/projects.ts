import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LiveMockClient } from "../client.js";
import { mockBaseUrl, presentProject } from "../domain.js";
import { ProjectM } from "../types.js";
import { resolveProject, run } from "./helpers.js";

const DEFAULT_MAX_REQUEST_LOG_NUMBER = 5000;

export function registerProjectTools(
  server: McpServer,
  client: LiveMockClient,
  baseUrl: string,
  writable = true
) {
  server.registerTool(
    "list_projects",
    {
      title: "List LiveMock projects",
      description:
        "List every project in LiveMock with its status, mock port and mock base URL.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () =>
      run(async () => {
        const projects = await client.listProjects();
        return projects.map((project) => presentProject(project, baseUrl));
      })
  );

  server.registerTool(
    "get_project",
    {
      title: "Get a LiveMock project",
      description:
        "Get one project by id or exact name, including its mock base URL.",
      inputSchema: {
        project: z.string().describe("Project id or exact project name"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ project }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        return presentProject(resolved, baseUrl);
      })
  );

  if (!writable) {
    return;
  }

  server.registerTool(
    "create_project",
    {
      title: "Create a LiveMock project",
      description:
        "Create a mock project. The project starts stopped; call start_project to listen on its port.",
      inputSchema: {
        name: z.string().describe("Project name"),
        description: z.string().optional(),
        port: z
          .union([z.string(), z.number()])
          .optional()
          .describe("Mock listener port; defaults to 8088"),
      },
    },
    async ({ name, description, port }) =>
      run(async () => {
        const project: ProjectM = {
          id: randomUUID(),
          name,
          description: description ?? "",
          port: String(port ?? "8088"),
          createDate: new Date().toISOString(),
          status: "STOPPED",
          error: false,
          errorMessage: null,
          unclosedWebsocketRequestLogIds: [],
          maxRequestLogNumber: DEFAULT_MAX_REQUEST_LOG_NUMBER,
        };
        return presentProject(await client.createProject(project), baseUrl);
      })
  );

  server.registerTool(
    "update_project",
    {
      title: "Update a LiveMock project",
      description:
        "Update a project's name, description, port or maximum request log count. A running project rejects a port change.",
      inputSchema: {
        project: z.string().describe("Project id or exact project name"),
        name: z.string().optional(),
        description: z.string().optional(),
        port: z.union([z.string(), z.number()]).optional(),
        maxRequestLogNumber: z.number().int().optional(),
      },
    },
    async ({ project, name, description, port, maxRequestLogNumber }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        const update: Partial<ProjectM> = {};
        if (name !== undefined) {
          update.name = name;
        }
        if (description !== undefined) {
          update.description = description;
        }
        if (port !== undefined) {
          update.port = String(port);
        }
        if (maxRequestLogNumber !== undefined) {
          update.maxRequestLogNumber = maxRequestLogNumber;
        }
        if (Object.keys(update).length === 0) {
          throw new Error("No project fields were provided to update.");
        }
        return presentProject(
          await client.updateProject(resolved.id, update),
          baseUrl
        );
      })
  );

  server.registerTool(
    "delete_project",
    {
      title: "Delete a LiveMock project",
      description:
        "Delete a project and its expectations, groups and logs. The project must be stopped first. This cannot be undone.",
      inputSchema: {
        project: z.string().describe("Project id or exact project name"),
      },
      annotations: { destructiveHint: true },
    },
    async ({ project }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        await client.deleteProject(resolved.id);
        return {
          message: "project deleted",
          projectId: resolved.id,
          name: resolved.name,
        };
      })
  );

  server.registerTool(
    "start_project",
    {
      title: "Start a LiveMock project",
      description:
        "Start a project's mock listener and return the URL it listens on.",
      inputSchema: {
        project: z.string().describe("Project id or exact project name"),
      },
    },
    async ({ project }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        await client.startProject(resolved.id);
        return {
          message: "project started",
          projectId: resolved.id,
          name: resolved.name,
          status: "STARTED",
          mockBaseUrl: mockBaseUrl(baseUrl, resolved.port),
        };
      })
  );

  server.registerTool(
    "stop_project",
    {
      title: "Stop a LiveMock project",
      description: "Stop a project's mock listener and release its port.",
      inputSchema: {
        project: z.string().describe("Project id or exact project name"),
      },
    },
    async ({ project }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        await client.stopProject(resolved.id);
        return {
          message: "project stopped",
          projectId: resolved.id,
          name: resolved.name,
          status: "STOPPED",
        };
      })
  );
}
