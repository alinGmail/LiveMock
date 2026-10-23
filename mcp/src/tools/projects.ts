import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LiveMockClient } from "../client.js";
import { mockBaseUrl, presentProject } from "../domain.js";
import { projectRefSchema } from "../schemas.js";
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
        "List every project in LiveMock with its id, name, status, mock port and mock base URL. Start here to discover projects and find the URL for test traffic.",
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
        "Get one project by id or exact name, including its status and mock base URL. Use list_projects when you need to browse.",
      inputSchema: {
        project: projectRefSchema,
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
        "Create a mock project. It starts STOPPED on port 8088 unless you pass another port. Add expectations with create_expectation or import_api_spec, then start_project to serve traffic.",
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
        "Update a project's name, description, port or maximum request log count. A STARTED project rejects a port change: call stop_project first.",
      inputSchema: {
        project: projectRefSchema,
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
        if (
          update.port !== undefined &&
          resolved.status !== "STOPPED" &&
          update.port !== resolved.port
        ) {
          throw new Error(
            `Project "${resolved.name}" is ${resolved.status}; call stop_project before changing its port.`
          );
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
        "Delete a project and its expectations, groups and request logs. The project must be STOPPED first. This cannot be undone.",
      inputSchema: {
        project: projectRefSchema,
      },
      annotations: { destructiveHint: true },
    },
    async ({ project }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        if (resolved.status !== "STOPPED") {
          throw new Error(
            `Project "${resolved.name}" is ${resolved.status}; call stop_project before deleting it.`
          );
        }
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
        "Start a project's mock listener and return its mock base URL. Send test requests to that URL; expectations do not serve traffic while the project is stopped.",
      inputSchema: {
        project: projectRefSchema,
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
      description:
        "Stop a project's mock listener and release its port. Expectations, groups and logs are kept.",
      inputSchema: {
        project: projectRefSchema,
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
