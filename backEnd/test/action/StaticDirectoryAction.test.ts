import * as fs from "fs";
import * as path from "path";
import express from "express";
import request from "supertest";
import {
  getExpectationCollection,
  getLogCollection,
  getProjectCollection,
  getProjectDb,
} from "../../src/db/dbManager";
import { createProject } from "livemock-core/struct/project";
import {
  createExpectation,
  ExpectationM,
} from "livemock-core/struct/expectation";
import {
  createPathMatcher,
  MatcherCondition,
} from "livemock-core/struct/matcher";
import { createStaticDirectoryAction } from "livemock-core/struct/action";
import { deleteFolderRecursive } from "../../src/common/utils";
import getMockRouter from "../../src/server/mockServer";

const dbFolder = "test_static_db";
const fixtureFolder = path.resolve("test_static_files");

describe("test static directory action", () => {
  const project = createProject();
  let expectationCollection: Collection<ExpectationM>;
  const server = express();

  beforeAll(async () => {
    fs.mkdirSync(path.join(fixtureFolder, "js"), { recursive: true });
    fs.writeFileSync(
      path.join(fixtureFolder, "js", "app.js"),
      "console.log('hi');"
    );
    fs.writeFileSync(
      path.join(fixtureFolder, "index.html"),
      "<h1>hello</h1>"
    );

    await getProjectDb(dbFolder);
    project.name = "test static directory";
    const projectCollection = await getProjectCollection(dbFolder);
    projectCollection.insert(project);

    const expectation = createExpectation();
    expectation.activate = true;
    const pathMatcher = createPathMatcher();
    pathMatcher.conditions = MatcherCondition.START_WITH;
    pathMatcher.value = "/static";
    expectation.matchers.push(pathMatcher);
    expectationCollection = await getExpectationCollection(project.id, dbFolder);
    expectationCollection.insert(expectation);

    server.all("*", await getMockRouter(dbFolder, project.id));
  });

  function setAction(
    folderPath: string,
    urlPrefix: string,
    options: { matcherPrefix?: string; delay?: number } = {}
  ) {
    const expectation = expectationCollection.findOne({});
    expectation!.matchers[0].value = options.matcherPrefix ?? "/static";
    expectation!.delay = options.delay ?? 0;
    const action = createStaticDirectoryAction();
    action.folderPath = folderPath;
    action.urlPrefix = urlPrefix;
    expectation!.actions = [action];
    expectationCollection.update(expectation!);
  }

  async function latestLog() {
    const logCollection = await getLogCollection(project.id, dbFolder);
    const logs = logCollection
      .chain()
      .find({})
      .simplesort("id", { desc: true })
      .data();
    return logs[0];
  }

  test("serves a nested file under the prefix and logs it", async () => {
    setAction(fixtureFolder, "/static");
    const testRes = await request(server)
      .get("/static/js/app.js?cache=1")
      .expect(200);
    expect(testRes.text).toBe("console.log('hi');");
    expect(testRes.get("content-type")).toContain("javascript");

    const log = await latestLog();
    expect(log.req!.path).toBe("/static/js/app.js");
    expect(log.res!.status).toBe(200);
    expect(log.res!.headers["content-type"]).toContain("javascript");
    expect(log.res!.rawBody).toBeUndefined();
    expect(log.proxyInfo?.isProxy).toBe(false);
  });

  test("serves the index file for the exact prefix without redirecting", async () => {
    setAction(fixtureFolder, "/static");
    const testRes = await request(server).get("/static").expect(200);
    expect(testRes.text).toBe("<h1>hello</h1>");
    expect(testRes.get("content-type")).toContain("html");
  });

  test("redirects nested folders under the prefix to a trailing slash", async () => {
    setAction(fixtureFolder, "/static");
    const testRes = await request(server).get("/static/js").expect(301);
    expect(testRes.headers.location).toBe("/static/js/");
  });

  test("404 for a directory without an index file", async () => {
    setAction(fixtureFolder, "/static");
    await request(server).get("/static/js/").expect(404);
  });

  test("rejects paths outside the prefix at a segment boundary", async () => {
    setAction(fixtureFolder, "/static");
    await request(server).get("/staticfoo/js/app.js").expect(404);
  });

  test("404 for a missing file and logs the rejection", async () => {
    setAction(fixtureFolder, "/static");
    await request(server).get("/static/js/missing.js").expect(404);

    const log = await latestLog();
    expect(log.res!.status).toBe(404);
    expect(log.proxyInfo?.isProxy).toBe(false);
  });

  test("404 for non-GET methods", async () => {
    setAction(fixtureFolder, "/static");
    await request(server).post("/static/js/app.js").expect(404);
  });

  test("never serves the working directory when folderPath is empty", async () => {
    setAction("", "/static");
    await request(server).get("/static/package.json").expect(404);
    setAction("   ", "/static");
    await request(server).get("/static/package.json").expect(404);
  });

  test("404 when the folder does not exist", async () => {
    setAction(path.join(fixtureFolder, "no-such-folder"), "/static");
    await request(server).get("/static/js/app.js").expect(404);
  });

  test("normalizes the prefix (leading/trailing slashes and whitespace)", async () => {
    setAction(fixtureFolder, " static/ ");
    await request(server).get("/static/js/app.js").expect(200);
  });

  test("a prefix of only slashes behaves as no prefix", async () => {
    setAction(fixtureFolder, "//", { matcherPrefix: "/" });
    await request(server).get("/js/app.js").expect(200);
  });

  test("an empty or root prefix serves without stripping", async () => {
    setAction(fixtureFolder, "", { matcherPrefix: "/" });
    await request(server).get("/js/app.js").expect(200);
    setAction(fixtureFolder, "/", { matcherPrefix: "/" });
    await request(server).get("/js/app.js").expect(200);
  });

  test("serves HEAD requests", async () => {
    setAction(fixtureFolder, "/static");
    const testRes = await request(server)
      .head("/static/js/app.js")
      .expect(200);
    expect(testRes.get("content-type")).toContain("javascript");
    expect(testRes.text).toBeFalsy();
  });

  test("applies the expectation delay", async () => {
    setAction(fixtureFolder, "/static", { delay: 200 });
    const start = Date.now();
    await request(server).get("/static/js/app.js").expect(200);
    expect(Date.now() - start).toBeGreaterThanOrEqual(150);
  });

  afterAll(async () => {
    deleteFolderRecursive(dbFolder);
    deleteFolderRecursive(fixtureFolder);
  });
});
