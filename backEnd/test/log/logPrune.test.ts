import lokijs, { Collection } from "lokijs";
import {
  createLog,
  createWebsocketInfo,
  LogM,
  WebsocketStatus,
} from "livemock-core/struct/log";
import {
  createProject,
  getMaxRequestLogNumber,
  ProjectM,
} from "livemock-core/struct/project";
import {
  pruneLogCollection,
  pruneProjectLogs,
  updateLogIfPresent,
} from "../../src/log/logUtils";
import { getLogCollection, getProjectCollection } from "../../src/db/dbManager";
import { deleteFolderRecursive } from "../../src/common/utils";

function makeLogCollection(count: number, firstId = 100001): Collection<LogM> {
  const db = new lokijs(`prune-test-${firstId}`);
  const collection = db.addCollection<LogM>("log");
  for (let i = 0; i < count; i++) {
    collection.insert(createLog(firstId + i));
  }
  return collection;
}

function markOpen(collection: Collection<LogM>, id: number) {
  const log = collection.findOne({ id });
  log!.websocketInfo = createWebsocketInfo();
  log!.websocketInfo!.status = WebsocketStatus.OPEN;
}

describe("pruneLogCollection", () => {
  test("does nothing when under the limit", () => {
    const collection = makeLogCollection(3);

    const removed = pruneLogCollection(collection, 10);

    expect(removed).toEqual([]);
    expect(collection.find({}).length).toBe(3);
  });

  test("does nothing when exactly at the limit", () => {
    const collection = makeLogCollection(5);

    const removed = pruneLogCollection(collection, 5);

    expect(removed).toEqual([]);
    expect(collection.find({}).length).toBe(5);
  });

  test("removes the oldest entries, keeping the newest", () => {
    const collection = makeLogCollection(10);

    const removed = pruneLogCollection(collection, 4);

    expect(removed).toEqual([100001, 100002, 100003, 100004, 100005, 100006]);
    const remainingIds = collection
      .find({})
      .map((log) => log.id)
      .sort((a, b) => a - b);
    expect(remainingIds).toEqual([100007, 100008, 100009, 100010]);
  });

  test("supports a max far below the current count", () => {
    const collection = makeLogCollection(10);

    const removed = pruneLogCollection(collection, 2);

    expect(removed.length).toBe(8);
    expect(collection.find({}).length).toBe(2);
    expect(
      collection
        .find({})
        .map((log) => log.id)
        .sort((a, b) => a - b)
    ).toEqual([100009, 100010]);
  });

  test("never removes open websocket logs, but still removes older closed ones", () => {
    const collection = makeLogCollection(10);
    markOpen(collection, 100001);
    markOpen(collection, 100002);
    markOpen(collection, 100003);

    const removed = pruneLogCollection(collection, 4);

    // overflow is 6, and the three oldest are open, so the next six oldest go
    expect(removed).toEqual([100004, 100005, 100006, 100007, 100008, 100009]);
    const remainingIds = collection
      .find({})
      .map((log) => log.id)
      .sort((a, b) => a - b);
    expect(remainingIds).toEqual([100001, 100002, 100003, 100010]);
  });

  test("returns no ids for an empty collection", () => {
    const collection = makeLogCollection(0);

    expect(pruneLogCollection(collection, 0)).toEqual([]);
    expect(collection.find({}).length).toBe(0);
  });
});

describe("updateLogIfPresent", () => {
  test("updates a log that is still in the collection", () => {
    const collection = makeLogCollection(1);
    const log = collection.findOne({ id: 100001 })!;

    log.res = null;
    updateLogIfPresent(collection, log);

    expect(collection.findOne({ id: 100001 })).not.toBeNull();
  });

  test("swallows the error when the log has already been removed", () => {
    const collection = makeLogCollection(1);
    const log = collection.findOne({ id: 100001 })!;
    collection.remove(log);

    expect(() => updateLogIfPresent(collection, log)).not.toThrow();
    expect(collection.find({}).length).toBe(0);
  });
});

describe("getMaxRequestLogNumber", () => {
  function projectWith(value: number | undefined): { maxRequestLogNumber?: number } {
    return value === undefined ? {} : { maxRequestLogNumber: value };
  }

  test("falls back to the default when unset", () => {
    expect(getMaxRequestLogNumber(projectWith(undefined))).toBe(5000);
  });

  test("keeps a value above the minimum", () => {
    expect(getMaxRequestLogNumber(projectWith(1500))).toBe(1500);
  });

  test("clamps values below the minimum up to 1000", () => {
    expect(getMaxRequestLogNumber(projectWith(500))).toBe(1000);
    expect(getMaxRequestLogNumber(projectWith(100))).toBe(1000);
    expect(getMaxRequestLogNumber(projectWith(0))).toBe(1000);
  });

  test("falls back to the default for a non-finite value", () => {
    expect(getMaxRequestLogNumber(projectWith(NaN))).toBe(5000);
  });
});

describe("pruneProjectLogs", () => {
  const path = "test_db_prune";

  afterAll(() => {
    deleteFolderRecursive(path);
  });

  test("trims a project and reconciles its unclosed websocket ids", async () => {
    const projectCollection = await getProjectCollection(path);
    const project: ProjectM = createProject();
    project.maxRequestLogNumber = 1000;
    const removedId = 100001;
    const keptId = 101003;
    project.unclosedWebsocketRequestLogIds = [removedId, keptId];
    projectCollection.insert(project);

    const logCollection = await getLogCollection(project.id, path);
    for (let i = 0; i < 1003; i++) {
      logCollection.insert(createLog(100001 + i));
    }

    await pruneProjectLogs(project, path);

    expect(logCollection.find({}).length).toBe(1000);
    expect(logCollection.findOne({ id: removedId })).toBeNull();
    expect(project.unclosedWebsocketRequestLogIds).toEqual([keptId]);

    const persisted = projectCollection.findOne({ id: project.id });
    expect(persisted!.unclosedWebsocketRequestLogIds).toEqual([keptId]);
  });
});
