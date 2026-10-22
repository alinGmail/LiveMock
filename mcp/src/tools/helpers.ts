import { LiveMockClient } from "../client.js";
import { errorMessage } from "../errors.js";
import { ProjectM } from "../types.js";

export function ok(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function fail(error: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: errorMessage(error),
      },
    ],
    isError: true,
  };
}

export async function run(fn: () => Promise<unknown>) {
  try {
    return ok(await fn());
  } catch (error) {
    return fail(error);
  }
}

/**
 * Resolve a project reference by id or exact name. Names are matched
 * case-sensitively first, then case-insensitively; anything else fails with
 * the available candidates so the model can recover without guessing.
 */
export async function resolveProject(
  client: LiveMockClient,
  reference: string
): Promise<ProjectM> {
  const projects = await client.listProjects();
  const byId = projects.find((project) => project.id === reference);
  if (byId) {
    return byId;
  }
  const byExactName = projects.find((project) => project.name === reference);
  if (byExactName) {
    return byExactName;
  }
  const lower = reference.toLowerCase();
  const byName = projects.filter(
    (project) => project.name.toLowerCase() === lower
  );
  if (byName.length === 1) {
    return byName[0];
  }
  if (byName.length > 1) {
    throw new Error(
      `Project name "${reference}" is ambiguous. Use an id instead: ${byName
        .map((project) => `${project.name} (${project.id})`)
        .join(", ")}`
    );
  }
  const available = projects
    .map((project) => `"${project.name}" (${project.id})`)
    .join(", ");
  throw new Error(
    `Project "${reference}" was not found. Available projects: ${
      available || "none"
    }`
  );
}

