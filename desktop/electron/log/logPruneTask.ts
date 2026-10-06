import { getProjectCollection } from "../db/dbManager";
import { ProjectM, ProjectStatus } from "livemock-core/struct/project";
import { getProjectStatus } from "../server/projectStatusManage";
import { pruneProjectLogs } from "./logUtils";

export const LOG_PRUNE_INTERVAL_MS = 60 * 1000;

let pruneRunning = false;

async function pruneProjects(
  path: string,
  shouldPrune: (project: ProjectM) => boolean
): Promise<void> {
  const projectCollection = await getProjectCollection(path);
  const projects = projectCollection.find({});
  for (const project of projects) {
    if (!shouldPrune(project)) {
      continue;
    }
    await pruneProjectLogs(project, path);
  }
}

/**
 * Trim every running project's request logs down to its configured maximum.
 */
export async function pruneRunningProjects(path: string): Promise<void> {
  return pruneProjects(
    path,
    (project) => getProjectStatus(project.id) === ProjectStatus.STARTED
  );
}

/**
 * Trim every project's request logs, regardless of status. Used once at
 * startup to clear any overflow that predates this process.
 */
export async function pruneAllProjects(path: string): Promise<void> {
  return pruneProjects(path, () => true);
}

/**
 * Start the periodic request log trimming task. There is a single timer per
 * process, it does not keep the process alive, and a tick is skipped if the
 * previous one has not finished.
 */
export function startLogPruneTask(path: string): void {
  const timer = setInterval(async () => {
    if (pruneRunning) {
      return;
    }
    pruneRunning = true;
    try {
      await pruneRunningProjects(path);
    } catch (err) {
      console.error(err);
    } finally {
      pruneRunning = false;
    }
  }, LOG_PRUNE_INTERVAL_MS);
  if (typeof timer.unref === "function") {
    timer.unref();
  }
}
