import { getProjectCollection } from "../db/dbManager";
import { ProjectStatus } from "livemock-core/struct/project";
import { getProjectStatus } from "../server/projectStatusManage";
import { pruneProjectLogs } from "./logUtils";

export const LOG_PRUNE_INTERVAL_MS = 60 * 1000;

let pruneRunning = false;

/**
 * Trim every running project's request logs down to its configured maximum.
 */
export async function pruneRunningProjects(path: string): Promise<void> {
  const projectCollection = await getProjectCollection(path);
  const projects = projectCollection.find({});
  for (const project of projects) {
    if (getProjectStatus(project.id) !== ProjectStatus.STARTED) {
      continue;
    }
    await pruneProjectLogs(project, path);
  }
}

/**
 * Trim every project's request logs, regardless of status. Used once at
 * startup to clear any overflow that predates this process.
 */
export async function pruneAllProjects(path: string): Promise<void> {
  const projectCollection = await getProjectCollection(path);
  const projects = projectCollection.find({});
  for (const project of projects) {
    await pruneProjectLogs(project, path);
  }
}

/**
 * Start the periodic request log trimming task. There is a single timer per
 * process, it does not keep the process alive, and a tick is skipped if the
 * previous one has not finished.
 */
export function startLogPruneTask(path: string): NodeJS.Timeout {
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
  timer.unref();
  return timer;
}
