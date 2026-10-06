import {
  createProject,
  ProjectM,
  ProjectStatus,
} from "livemock-core/struct/project";
import { createLog } from "livemock-core/struct/log";
import { getLogCollection, getProjectCollection } from "../../src/db/dbManager";
import { setProjectStatus } from "../../src/server/projectStatusManage";
import {
  LOG_PRUNE_INTERVAL_MS,
  pruneAllProjects,
  pruneRunningProjects,
  startLogPruneTask,
} from "../../src/log/logPruneTask";
import { deleteFolderRecursive } from "../../src/common/utils";

const path = "test_db_prune_task";

async function createOverLimitProject(): Promise<ProjectM> {
  const projectCollection = await getProjectCollection(path);
  const project = createProject();
  project.maxRequestLogNumber = 1000;
  projectCollection.insert(project);
  const logCollection = await getLogCollection(project.id, path);
  for (let i = 0; i < 1003; i++) {
    logCollection.insert(createLog(100001 + i));
  }
  return project;
}

async function logCount(projectId: string): Promise<number> {
  const logCollection = await getLogCollection(projectId, path);
  return logCollection.find({}).length;
}

describe("request log prune task", () => {
  afterAll(() => {
    deleteFolderRecursive(path);
  });

  test("pruneRunningProjects only trims started projects", async () => {
    const running = await createOverLimitProject();
    const stopped = await createOverLimitProject();
    setProjectStatus(running.id, ProjectStatus.STARTED);
    setProjectStatus(stopped.id, ProjectStatus.STOPPED);

    await pruneRunningProjects(path);

    expect(await logCount(running.id)).toBe(1000);
    expect(await logCount(stopped.id)).toBe(1003);
  });

  test("pruneAllProjects trims every project regardless of status", async () => {
    const project = await createOverLimitProject();
    setProjectStatus(project.id, ProjectStatus.STOPPED);

    await pruneAllProjects(path);

    expect(await logCount(project.id)).toBe(1000);
  });

  test("startLogPruneTask trims running projects on the interval", async () => {
    // open the databases before switching to fake timers, since Loki's
    // autoload/autosave relies on real timers
    const project = await createOverLimitProject();
    setProjectStatus(project.id, ProjectStatus.STARTED);

    jest.useFakeTimers();
    try {
      startLogPruneTask(path);
      await jest.advanceTimersByTimeAsync(LOG_PRUNE_INTERVAL_MS);

      expect(await logCount(project.id)).toBe(1000);
    } finally {
      jest.useRealTimers();
    }
  });
});
