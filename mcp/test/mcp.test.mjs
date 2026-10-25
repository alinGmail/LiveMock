import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const SERVER_ENTRY = fileURLToPath(new URL("../dist/index.js", import.meta.url));
const TOKEN = "test-token";

function json(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json" });
  res.end(text);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString();
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function startFakeLiveMock() {
  const state = {
    requests: [],
    projects: [
      {
        id: "project-1",
        name: "demo",
        description: "Demo project",
        port: "8088",
        status: "STOPPED",
        createDate: new Date().toISOString(),
        error: false,
        errorMessage: null,
        unclosedWebsocketRequestLogIds: [],
        maxRequestLogNumber: 5000,
      },
    ],
    expectations: [
      {
        id: "exp-1",
        name: "GET /users/1",
        description: "",
        delay: 0,
        priority: 0,
        activate: true,
        groupId: "group-1",
        createTime: new Date().toISOString(),
        matchers: [
          { id: "m-1", type: "method", conditions: "IS", value: "GET" },
          { id: "m-2", type: "path", conditions: "IS", value: "/users/1" },
        ],
        actions: [
          {
            id: "a-1",
            type: "CUSTOM_RESPONSE",
            status: 200,
            responseContent: {
              type: "JSON",
              value: '{"id":1}',
              headers: [],
              contentHandler: "NONE",
            },
          },
        ],
      },
    ],
    groups: [
      {
        id: "group-1",
        name: "users",
        activate: true,
        priority: 0,
        createTime: new Date().toISOString(),
      },
    ],
    logs: [
      {
        id: 100001,
        expectationId: "exp-1",
        proxyInfo: { isProxy: false, proxyHost: null, proxyPath: null },
        req: {
          method: "GET",
          path: "/users/1",
          headers: {},
          query: {},
          body: null,
          rawBody: null,
          requestTime: Date.now(),
          requestTimeStr: new Date().toString(),
        },
        res: {
          status: 200,
          statusMessage: "OK",
          headers: {},
          body: { id: 1 },
          rawBody: '{"id":1}',
          duration: 3,
          responseTime: Date.now(),
          responseTimeStr: new Date().toString(),
        },
      },
    ],
  };

  const queryMap = (searchParams) => {
    const query = {};
    for (const [key, value] of searchParams) {
      if (query[key] === undefined) {
        query[key] = value;
      } else if (Array.isArray(query[key])) {
        query[key].push(value);
      } else {
        query[key] = [query[key], value];
      }
    }
    return query;
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const body = await readBody(req);
    state.requests.push({
      method: req.method,
      path: url.pathname,
      query: queryMap(url.searchParams),
      body,
      authorization: req.headers.authorization,
    });

    if (req.headers.authorization === `Bearer forbidden-token`) {
      return json(res, 403, { error: { message: "forbidden" } });
    }
    if (req.headers.authorization !== `Bearer ${TOKEN}`) {
      return json(res, 401, { error: { message: "unauthorized" } });
    }

    const path = url.pathname;
    if (req.method === "GET" && path === "/api/project/") {
      return json(res, 200, state.projects);
    }
    if (req.method === "POST" && path === "/api/project/") {
      state.projects.push(body.project);
      return json(res, 200, body.project);
    }
    if (req.method === "PUT" && path.startsWith("/api/project/")) {
      const project = state.projects.find(
        (item) => item.id === path.split("/").pop()
      );
      Object.assign(project, body.projectUpdate);
      return json(res, 200, project);
    }
    if (req.method === "POST" && path.startsWith("/api/project/start/")) {
      const project = state.projects.find(
        (item) => item.id === path.split("/").pop()
      );
      if (project) {
        project.status = "STARTED";
      }
      return json(res, 200, { message: "success" });
    }
    if (req.method === "POST" && path.startsWith("/api/project/stop/")) {
      const project = state.projects.find(
        (item) => item.id === path.split("/").pop()
      );
      if (project) {
        project.status = "STOPPED";
      }
      return json(res, 200, { message: "success" });
    }
    if (req.method === "DELETE" && path.startsWith("/api/project/")) {
      return json(res, 200, { message: "success" });
    }
    if (req.method === "GET" && path === "/api/expectation/") {
      return json(res, 200, state.expectations);
    }
    if (req.method === "POST" && path === "/api/expectation/") {
      state.expectations.push(body.expectation);
      return json(res, 200, body.expectation);
    }
    if (req.method === "POST" && path === "/api/expectation/batchImport") {
      if (body?.content === "invalid") {
        return json(res, 400, { error: { message: "cannot parse spec" } });
      }
      return json(res, 200, {
        format: "openapi",
        created: 2,
        overwritten: 0,
        skipped: 1,
        failures: [],
      });
    }
    if (req.method === "GET" && path.startsWith("/api/expectation/")) {
      const expectation = state.expectations.find(
        (item) => item.id === path.split("/").pop()
      );
      return expectation
        ? json(res, 200, expectation)
        : json(res, 500, { error: { message: "expectation not exist" } });
    }
    if (req.method === "PUT" && path.startsWith("/api/expectation/")) {
      const expectation = state.expectations.find(
        (item) => item.id === path.split("/").pop()
      );
      Object.assign(expectation, body.expectationUpdate);
      return json(res, 200, expectation);
    }
    if (req.method === "DELETE" && path.startsWith("/api/expectation/")) {
      return json(res, 200, { message: "success" });
    }
    if (req.method === "GET" && path === "/api/group/") {
      return json(res, 200, state.groups);
    }
    if (req.method === "POST" && path === "/api/group/") {
      state.groups.push(body.group);
      return json(res, 200, body.group);
    }
    if (req.method === "PUT" && path.startsWith("/api/group/")) {
      const group = state.groups.find(
        (item) => item.id === path.split("/").pop()
      );
      Object.assign(group, body.groupUpdate);
      return json(res, 200, group);
    }
    if (req.method === "DELETE" && path.startsWith("/api/group/")) {
      return json(res, 200, { message: "success" });
    }
    if (req.method === "GET" && path === "/api/log/") {
      return json(res, 200, state.logs);
    }
    if (req.method === "GET" && path === "/api/log/query") {
      return json(res, 200, { logs: state.logs, hasMore: false });
    }
    if (req.method === "GET" && path.startsWith("/api/log/detail/")) {
      if (path.endsWith("/999")) {
        return json(res, 404, { error: { message: "log not found" } });
      }
      return json(res, 200, { logItem: state.logs[0] });
    }
    return json(res, 404, { error: { message: "not found" } });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}`;
  return {
    url,
    state,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function connect(env) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_ENTRY],
    env: { ...process.env, ...env },
    stderr: "pipe",
  });
  const client = new Client({ name: "livemock-test", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

async function call(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  const text = result.content?.[0]?.text ?? "";
  return {
    isError: !!result.isError,
    text,
    data: result.isError ? null : JSON.parse(text),
  };
}

test("MCP server exposes the expected tools and can resolve a project", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const tools = await client.listTools();
    const names = tools.tools.map((tool) => tool.name);
    assert.equal(names.length, 19);
    assert.ok(names.includes("list_projects"));
    assert.ok(names.includes("create_expectation"));
    assert.ok(names.includes("import_api_spec"));

    const listed = await call(client, "list_projects");
    assert.equal(listed.isError, false);
    assert.equal(listed.data[0].name, "demo");
    assert.equal(listed.data[0].mockBaseUrl, "http://127.0.0.1:8088");

    const byName = await call(client, "get_project", { project: "demo" });
    assert.equal(byName.data.id, "project-1");
  } finally {
    await client.close();
    await fake.close();
  }
});

test("server instructions explain the LiveMock domain and workflow", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const instructions = client.getInstructions();
    assert.equal(typeof instructions, "string");
    for (const term of [
      "Project",
      "Expectation",
      "Matcher",
      "Action",
      "Group",
      "Request log",
      "start_project",
      "priority",
      "milliseconds",
      "first action",
      "ungrouped",
      "block of its own",
      "member priorities",
    ]) {
      assert.match(
        instructions,
        new RegExp(term, "i"),
        `instructions should mention ${term}`
      );
    }

    const tools = await client.listTools();
    const create = tools.tools.find(
      (tool) => tool.name === "create_expectation"
    );
    assert.match(create.description, /first action/);
    assert.match(create.description, /CUSTOM_RESPONSE/);
    const fields = create.inputSchema.properties.expectation.properties;
    assert.match(fields.delay.description, /milliseconds/i);
    assert.match(fields.priority.description, /higher/i);
    assert.match(fields.priority.description, /ungrouped/i);
    assert.match(fields.priority.description, /group's priority/i);
    assert.match(fields.groupId.description, /own match-order block/i);
    assert.match(fields.groupId.description, /priority and createTime/i);
    assert.match(fields.matchers.description, /all matchers must match/i);
  } finally {
    await client.close();
    await fake.close();
  }
});

test("project tools cover create, update, start, stop and running-state refusals", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const created = await call(client, "create_project", {
      name: "managed",
      port: 9091,
    });
    assert.equal(created.isError, false, created.text);
    assert.equal(created.data.port, "9091");
    const projectId = created.data.id;

    const updated = await call(client, "update_project", {
      project: projectId,
      name: "managed-2",
      maxRequestLogNumber: 2000,
    });
    assert.equal(updated.data.name, "managed-2");
    assert.equal(updated.data.maxRequestLogNumber, 2000);

    const started = await call(client, "start_project", { project: projectId });
    assert.equal(started.data.status, "STARTED");

    const portChange = await call(client, "update_project", {
      project: projectId,
      port: 9092,
    });
    assert.equal(portChange.isError, true);
    assert.match(portChange.text, /stop_project/);

    const deletion = await call(client, "delete_project", {
      project: projectId,
    });
    assert.equal(deletion.isError, true);
    assert.match(deletion.text, /stop_project/);

    const stopped = await call(client, "stop_project", { project: projectId });
    assert.equal(stopped.data.status, "STOPPED");
    const deleted = await call(client, "delete_project", {
      project: projectId,
    });
    assert.equal(deleted.isError, false, deleted.text);
  } finally {
    await client.close();
    await fake.close();
  }
});

test("update_expectation passes raw matchers through without create-time defaults", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const updated = await call(client, "update_expectation", {
      project: "demo",
      expectationId: "exp-1",
      expectationUpdate: {
        matchers: [{ type: "path", value: "/changed" }],
      },
    });
    assert.equal(updated.isError, false, updated.text);
    const request = fake.state.requests.find(
      (entry) => entry.method === "PUT" && entry.path === "/api/expectation/exp-1"
    );
    assert.deepEqual(request.body.expectationUpdate.matchers[0], {
      type: "path",
      value: "/changed",
    });
  } finally {
    await client.close();
    await fake.close();
  }
});

test("unknown and ambiguous project names list candidates", async () => {
  const fake = await startFakeLiveMock();
  fake.state.projects.push(
    { ...fake.state.projects[0], id: "project-2", name: "twin" },
    { ...fake.state.projects[0], id: "project-3", name: "twin" }
  );
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const ambiguous = await call(client, "get_project", {
      project: "twin",
    });
    assert.equal(ambiguous.isError, true);
    assert.match(ambiguous.text, /ambiguous/);

    const unknown = await call(client, "get_project", { project: "nope" });
    assert.equal(unknown.isError, true);
    assert.match(unknown.text, /Available projects/);
    assert.match(unknown.text, /demo/);
  } finally {
    await client.close();
    await fake.close();
  }
});

test("API and parse errors are translated", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const missingExpectation = await call(client, "get_expectation", {
      project: "demo",
      expectationId: "missing",
    });
    assert.match(missingExpectation.text, /500: expectation not exist/);

    const missingLog = await call(client, "get_log", {
      project: "demo",
      logId: 999,
    });
    assert.match(missingLog.text, /404: log not found/);

    const badImport = await call(client, "import_api_spec", {
      project: "demo",
      content: "invalid",
    });
    assert.match(badImport.text, /400: cannot parse spec/);
  } finally {
    await client.close();
    await fake.close();
  }

  const forbiddenFake = await startFakeLiveMock();
  const forbiddenClient = await connect({
    LIVEMOCK_URL: forbiddenFake.url,
    LIVEMOCK_API_TOKEN: "forbidden-token",
  });
  try {
    const forbidden = await call(forbiddenClient, "list_projects");
    assert.equal(forbidden.isError, true);
    assert.match(forbidden.text, /refused the request \(403\)/);
  } finally {
    await forbiddenClient.close();
    await forbiddenFake.close();
  }
});

test("read-only mode hides write tools", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
    LIVEMOCK_MCP_READ_ONLY: "1",
  });
  try {
    const tools = await client.listTools();
    const names = tools.tools.map((tool) => tool.name);
    assert.equal(names.length, 7);
    assert.ok(names.includes("list_expectations"));
    assert.ok(!names.includes("create_expectation"));
    assert.ok(!names.includes("start_project"));
    assert.match(client.getInstructions(), /read-only/i);
  } finally {
    await client.close();
    await fake.close();
  }
});

test("create_expectation sends raw shapes and fills structural defaults", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const created = await call(client, "create_expectation", {
      project: "demo",
      expectation: {
        name: "GET /users/1",
        matchers: [
          { type: "method", value: "GET" },
          { type: "path", value: "/users/1" },
        ],
        actions: [
          {
            type: "CUSTOM_RESPONSE",
            responseContent: { value: '{"id":1}' },
          },
        ],
      },
    });
    assert.equal(created.isError, false);
    assert.match(created.text, /call start_project/);
    assert.ok(created.data.id);
    assert.ok(created.data.matchers[0].id);
    assert.equal(created.data.matchers[0].conditions, "IS");
    assert.equal(created.data.actions[0].status, 200);
    assert.equal(created.data.actions[0].responseContent.type, "JSON");
    assert.deepEqual(created.data.actions[0].responseContent.headers, []);

    const posted = fake.state.requests.find(
      (request) =>
        request.method === "POST" && request.path === "/api/expectation/"
    );
    assert.equal(posted.body.expectation.actions[0].type, "CUSTOM_RESPONSE");
  } finally {
    await client.close();
    await fake.close();
  }
});

test("expectation summaries and full payloads differ", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const summary = await call(client, "list_expectations", {
      project: "demo",
    });
    assert.equal(summary.data[0].matchers[0], "method IS GET");

    const full = await call(client, "list_expectations", {
      project: "demo",
      full: true,
    });
    assert.equal(full.data[0].matchers[0].type, "method");
  } finally {
    await client.close();
    await fake.close();
  }
});

test("logs summarize bodies unless asked", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const summary = await call(client, "list_logs", { project: "demo" });
    assert.equal(summary.data.logs[0].method, "GET");
    assert.equal(summary.data.logs[0].requestBody, undefined);
    assert.equal(summary.data.hasMore, false);

    const withBody = await call(client, "list_logs", {
      project: "demo",
      includeBody: true,
    });
    assert.deepEqual(withBody.data.logs[0].responseBody, { id: 1 });

    const detail = await call(client, "get_log", {
      project: "demo",
      logId: 100001,
    });
    assert.equal(detail.data.id, 100001);
  } finally {
    await client.close();
    await fake.close();
  }
});

test("list_logs forwards ad-hoc filters and pagination to the query endpoint", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const result = await call(client, "list_logs", {
      project: "demo",
      method: ["GET", "POST"],
      path: "/users/1",
      pathContains: "/users",
      status: ["2xx", 500],
      expectationId: "exp-1",
      since: 1700000000000,
      until: "2026-01-01T00:00:00.000Z",
      limit: 1,
      maxLogId: 100010,
      includeBody: true,
    });
    assert.equal(result.isError, false, result.text);
    assert.equal(result.data.hasMore, false);

    const request = fake.state.requests.find(
      (entry) => entry.path === "/api/log/query"
    );
    assert.deepEqual(request.query.method, ["GET", "POST"]);
    assert.deepEqual(request.query.status, ["2xx", "500"]);
    assert.equal(request.query.path, "/users/1");
    assert.equal(request.query.pathContains, "/users");
    assert.equal(request.query.expectationId, "exp-1");
    assert.equal(request.query.since, "1700000000000");
    assert.equal(request.query.until, "2026-01-01T00:00:00.000Z");
    assert.equal(request.query.limit, "1");
    assert.equal(request.query.maxLogId, "100010");
    assert.equal(request.query.includeBody, "true");
  } finally {
    await client.close();
    await fake.close();
  }
});

test("group deletion reports removed expectations and import returns counts", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const deleted = await call(client, "delete_group", {
      project: "demo",
      groupId: "group-1",
    });
    assert.equal(deleted.data.deletedExpectations, 1);

    const imported = await call(client, "import_api_spec", {
      project: "demo",
      content: "openapi: 3.0.0",
    });
    assert.equal(imported.data.created, 2);
    assert.equal(imported.data.skipped, 1);
  } finally {
    await client.close();
    await fake.close();
  }
});

test("a missing token and a trailing /api base URL are handled", async () => {
  const fake = await startFakeLiveMock();
  const noToken = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: "",
  });
  try {
    const missing = await call(noToken, "list_projects");
    assert.equal(missing.isError, true);
    assert.match(missing.text, /LIVEMOCK_API_TOKEN is not set/);
  } finally {
    await noToken.close();
  }

  const withApiSuffix = await connect({
    LIVEMOCK_URL: `${fake.url}/api`,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const listed = await call(withApiSuffix, "list_projects");
    assert.equal(listed.isError, false, listed.text);
    assert.equal(listed.data[0].name, "demo");
  } finally {
    await withApiSuffix.close();
    await fake.close();
  }
});

test("credential and connection errors are readable MCP errors", async () => {
  const fake = await startFakeLiveMock();
  const badTokenClient = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: "wrong-token",
  });
  try {
    const rejected = await call(badTokenClient, "list_projects");
    assert.equal(rejected.isError, true);
    assert.match(rejected.text, /rejected the API token/);
  } finally {
    await badTokenClient.close();
    await fake.close();
  }

  const closed = await startFakeLiveMock();
  const unreachableUrl = closed.url;
  await closed.close();
  const unreachableClient = await connect({
    LIVEMOCK_URL: unreachableUrl,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const unreachable = await call(unreachableClient, "list_projects");
    assert.equal(unreachable.isError, true);
    assert.match(unreachable.text, /Could not reach LiveMock/);
  } finally {
    await unreachableClient.close();
  }
});
