import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LiveMockClient } from "../client.js";
import { stripInternal } from "../domain.js";
import {
  presetName as presetNameSchema,
  presetValue,
  simpleFilterInputSchema,
} from "../logFilters.js";
import {
  LogViewM,
  PresetFilterInput,
  PresetName,
  ProjectM,
  SimpleFilterInput,
  ViewFilterM,
} from "../types.js";
import { projectRefSchema } from "../schemas.js";
import { resolveProject, run } from "./helpers.js";

export async function resolveLogView(
  client: LiveMockClient,
  projectReference: string
): Promise<{ project: ProjectM; view: LogViewM }> {
  const project = await resolveProject(client, projectReference);
  const views = await client.listLogViews(project.id);
  if (views.length === 0) {
    throw new Error(
      `Project "${project.name}" has no log view. This project's data is incomplete; recreate the project.`
    );
  }
  if (views.length > 1) {
    throw new Error(
      `Project "${project.name}" has multiple log views (ids: ${views
        .map((view) => view.id)
        .join(", ")}). Refusing to guess which one to use.`
    );
  }
  return { project, view: views[0] };
}

function presentLogView(view: LogViewM) {
  return {
    id: view.id,
    filters: (view.filters ?? []).map((filter) => stripInternal(filter)),
  };
}

function findViewFilter(
  view: LogViewM,
  filterId: string
): ViewFilterM | undefined {
  return (view.filters ?? []).find((filter) => filter.id === filterId);
}

const PRESET_DEFINITIONS: Record<
  PresetName,
  { property: string; condition: "EQUAL" | "IN" | "FAMILY" }
> = {
  EXPECTATION: { property: "expectationId", condition: "EQUAL" },
  METHODS: { property: "req.method", condition: "IN" },
  STATUS_CODE: { property: "res.status", condition: "FAMILY" },
};

async function reloadLogView(
  client: LiveMockClient,
  projectId: string,
  logViewId: string
): Promise<LogViewM> {
  const views = await client.listLogViews(projectId);
  const view = views.find((item) => item.id === logViewId);
  if (!view) {
    throw new Error(`Log view "${logViewId}" disappeared while writing.`);
  }
  return view;
}

export function registerLogViewTools(
  server: McpServer,
  client: LiveMockClient,
  writable = false
) {
  server.registerTool(
    "get_log_view",
    {
      title: "Get the LiveMock saved log view",
      description:
        "Read the project's saved log view: its id and filters. This is the persistent filter set shared with the web UI, not an ad-hoc query. Use filter_logs for temporary queries that must not touch the saved view.",
      inputSchema: {
        project: projectRefSchema,
      },
      annotations: { readOnlyHint: true },
    },
    async ({ project }) =>
      run(async () => {
        const resolved = await resolveLogView(client, project);
        return presentLogView(resolved.view);
      })
  );

  if (!writable) {
    return;
  }

  server.registerTool(
    "add_view_filter",
    {
      title: "Add a filter to the saved log view",
      description:
        "Add a simple filter to the project's saved log view. This changes the shared view used by the web UI, does not live-refresh it, is last-write-wins and is not atomic. Use update_view_preset for preset filters. Returns the saved filter (with its generated id) and the latest view.",
      inputSchema: {
        project: projectRefSchema,
        filter: simpleFilterInputSchema,
      },
    },
    async ({ project, filter }) =>
      run(async () => {
        const resolved = await resolveLogView(client, project);
        const input = filter as SimpleFilterInput;
        const filterId = input.id ?? randomUUID();
        const created: SimpleFilterInput = {
          type: "SIMPLE_FILTER",
          id: filterId,
          property: input.property.trim(),
          condition: input.condition,
          value: input.value,
          activate: input.activate ?? true,
        };
        await client.addLogFilter(resolved.project.id, resolved.view.id, created);
        const latest = await reloadLogView(
          client,
          resolved.project.id,
          resolved.view.id
        );
        const stored = findViewFilter(latest, filterId);
        if (!stored) {
          throw new Error(
            `View filter "${filterId}" was not returned after it was added.`
          );
        }
        return {
          filter: stripInternal(stored),
          logView: presentLogView(latest),
        };
      })
  );

  server.registerTool(
    "update_view_filter",
    {
      title: "Update a filter in the saved log view",
      description:
        "Update an existing simple filter by id in the project's saved log view. This changes the shared view used by the web UI, does not live-refresh it, is last-write-wins and is not atomic. Preset filters must be changed with update_view_preset. Returns the saved filter and the latest view.",
      inputSchema: {
        project: projectRefSchema,
        filterId: z.string().describe("Id of the saved view filter to update"),
        filter: simpleFilterInputSchema,
      },
    },
    async ({ project, filterId, filter }) =>
      run(async () => {
        const resolved = await resolveLogView(client, project);
        const current = findViewFilter(resolved.view, filterId);
        if (!current) {
          throw new Error(
            `View filter "${filterId}" was not found in project "${resolved.project.name}".`
          );
        }
        if (current.type !== "SIMPLE_FILTER") {
          throw new Error(
            `View filter "${filterId}" is a preset. Use update_view_preset instead.`
          );
        }
        const input = filter as SimpleFilterInput;
        const updated: SimpleFilterInput = {
          type: "SIMPLE_FILTER",
          id: filterId,
          property: input.property.trim(),
          condition: input.condition,
          value: input.value,
          activate: input.activate ?? current.activate ?? true,
        };
        await client.updateLogFilter(
          resolved.project.id,
          resolved.view.id,
          filterId,
          updated
        );
        const latest = await reloadLogView(
          client,
          resolved.project.id,
          resolved.view.id
        );
        const stored = findViewFilter(latest, filterId);
        if (!stored) {
          throw new Error(
            `View filter "${filterId}" was not returned after it was updated.`
          );
        }
        return {
          filter: stripInternal(stored),
          logView: presentLogView(latest),
        };
      })
  );

  server.registerTool(
    "delete_view_filter",
    {
      title: "Delete a filter from the saved log view",
      description:
        "Delete a saved view filter by id. This changes the shared view used by the web UI, does not live-refresh it, is last-write-wins and is not atomic. This cannot be undone. Returns the removed filter and the latest view.",
      inputSchema: {
        project: projectRefSchema,
        filterId: z.string().describe("Id of the saved view filter to delete"),
      },
      annotations: { destructiveHint: true },
    },
    async ({ project, filterId }) =>
      run(async () => {
        const resolved = await resolveLogView(client, project);
        const current = findViewFilter(resolved.view, filterId);
        if (!current) {
          throw new Error(
            `View filter "${filterId}" was not found in project "${resolved.project.name}".`
          );
        }
        await client.deleteLogFilter(
          resolved.project.id,
          resolved.view.id,
          filterId
        );
        const latest = await reloadLogView(
          client,
          resolved.project.id,
          resolved.view.id
        );
        return {
          removed: stripInternal(current),
          logView: presentLogView(latest),
        };
      })
  );

  server.registerTool(
    "update_view_preset",
    {
      title: "Set a preset on the saved log view",
      description:
        "Set or remove a preset on the project's saved log view: EXPECTATION (expectation id), METHODS (HTTP methods) or STATUS_CODE (status families or exact codes). An empty string, null or empty array removes the preset. This changes the shared view used by the web UI, does not live-refresh it, is last-write-wins and is not atomic. Returns the latest preset (or null) and the latest view.",
      inputSchema: {
        project: projectRefSchema,
        name: presetNameSchema,
        value: presetValue,
      },
    },
    async ({ project, name, value }) =>
      run(async () => {
        const resolved = await resolveLogView(client, project);
        const preset = name as PresetName;
        let normalized: string | Array<string> | null;

        if (preset === "EXPECTATION") {
          if (value !== null && typeof value !== "string") {
            throw new Error(
              "EXPECTATION preset value must be an expectation id string or null."
            );
          }
          const trimmed = typeof value === "string" ? value.trim() : "";
          normalized = trimmed === "" ? null : trimmed;
        } else {
          if (typeof value === "string" && value.trim() !== "") {
            throw new Error(
              `${preset} preset value must be an array, or an empty string/null to remove it.`
            );
          }
          if (value !== null && !Array.isArray(value) && typeof value !== "string") {
            throw new Error(
              `${preset} preset value must be an array of strings or null.`
            );
          }
          const items = Array.isArray(value) ? value : [];
          if (
            preset === "METHODS" &&
            items.some((item) => typeof item !== "string")
          ) {
            throw new Error("METHODS preset values must be strings.");
          }
          const cleaned = items
            .map((item) => String(item).trim())
            .filter((item) => item !== "")
            .map((item) =>
              preset === "METHODS" ? item.toUpperCase() : item
            );
          normalized = cleaned.length > 0 ? cleaned : null;
        }

        const definition = PRESET_DEFINITIONS[preset];
        const filter: PresetFilterInput = {
          type: "PRESET_FILTER",
          id: randomUUID(),
          name: preset,
          property: definition.property,
          condition: definition.condition,
          value: normalized,
          activate: true,
        };
        await client.updatePresetLogFilter(
          resolved.project.id,
          resolved.view.id,
          filter
        );
        const latest = await reloadLogView(
          client,
          resolved.project.id,
          resolved.view.id
        );
        const stored = (latest.filters ?? []).find(
          (item) =>
            item.type === "PRESET_FILTER" && item.name === preset
        );
        return {
          filter: stored ? stripInternal(stored) : null,
          logView: presentLogView(latest),
        };
      })
  );
}
