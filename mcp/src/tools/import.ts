import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LiveMockClient } from "../client.js";
import { projectRefSchema } from "../schemas.js";
import { resolveProject, run } from "./helpers.js";

export function registerImportTool(
  server: McpServer,
  client: LiveMockClient,
  writable = true
) {
  if (!writable) {
    return;
  }

  server.registerTool(
    "import_api_spec",
    {
      title: "Import an API spec into LiveMock",
      description:
        "Import an OpenAPI, Swagger or Postman document as expectations. Returns created, overwritten, skipped and failed counts.",
      inputSchema: {
        project: projectRefSchema,
        content: z
          .string()
          .describe("Raw document content (JSON or YAML) as a string"),
        overwrite: z
          .boolean()
          .optional()
          .describe("Overwrite existing expectations with the same method and path"),
      },
    },
    async ({ project, content, overwrite }) =>
      run(async () => {
        const resolved = await resolveProject(client, project);
        return client.importApiSpec(
          resolved.id,
          content,
          overwrite ?? false
        );
      })
  );
}
