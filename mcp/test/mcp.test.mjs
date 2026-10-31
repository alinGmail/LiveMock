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
    logViews: [
      {
        id: "view-1",
        name: "",
        filters: [
          {
            type: "SIMPLE_FILTER",
            id: "filter-1",
            property: "req.path",
            condition: "CONTAINS",
            value: "/users",
            activate: true,
          },
        ],
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
    if (req.method === "GET" && path === "/api/log/logView") {
      return json(res, 200, state.logViews);
    }
    if (req.method === "POST" && path === "/api/logFilter/") {
      const view = state.logViews.find((item) => item.id === body.logViewId);
      view.filters.push(body.filter);
      return json(res, 200, { message: "success" });
    }
    if (
      req.method === "POST" &&
      path === "/api/logFilter/updatePresetLogFilter"
    ) {
      const view = state.logViews.find((item) => item.id === body.logViewId);
      const index = view.filters.findIndex(
        (item) =>
          item.type === "PRESET_FILTER" && item.name === body.filter.name
      );
      const empty =
        body.filter.value === null ||
        (Array.isArray(body.filter.value) &&
          body.filter.value.length === 0);
      if (empty) {
        if (index !== -1) {
          view.filters.splice(index, 1);
        }
      } else if (index === -1) {
        view.filters.push(body.filter);
      } else {
        view.filters[index] = {
          ...view.filters[index],
          value: body.filter.value,
        };
      }
      return json(res, 200, { message: "success" });
    }
    if (req.method === "POST" && path.startsWith("/api/logFilter/")) {
      const filterId = path.split("/").pop();
      const view = state.logViews.find((item) => item.id === body.logViewId);
      const index = view.filters.findIndex((item) => item.id === filterId);
      if (index !== -1) {
        view.filters[index] = body.filter;
      }
      return json(res, 200, { message: "success" });
    }
    if (req.method === "DELETE" && path.startsWith("/api/logFilter/")) {
      const filterId = path.split("/").pop();
      const view = state.logViews.find(
        (item) => item.id === url.searchParams.get("logViewId")
      );
      view.filters = view.filters.filter((item) => item.id !== filterId);
      return json(res, 200, { message: "success" });
    }
    if (req.method === "GET" && path === "/api/log/") {
      return json(res, 200, state.logs);
    }
    if (req.method === "GET" && path === "/api/log/query") {
      return json(res, 200, { logs: state.logs, hasMore: false });
    }
    if (req.method === "POST" && path === "/api/log/queryByFilters") {
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
    assert.equal(names.length, 25);
    assert.ok(names.includes("list_projects"));
    assert.ok(names.includes("filter_logs"));
    assert.ok(names.includes("get_log_view"));
    assert.ok(names.includes("add_view_filter"));
    assert.ok(names.includes("update_view_filter"));
    assert.ok(names.includes("delete_view_filter"));
    assert.ok(names.includes("update_view_preset"));
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
      "filter_logs",
      "get_log_view",
      "add_view_filter",
      "update_view_preset",
      "FAMILY",
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

test("get_log_view reads the saved view and refuses missing or ambiguous views", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const view = await call(client, "get_log_view", { project: "demo" });
    assert.equal(view.isError, false, view.text);
    assert.equal(view.data.id, "view-1");
    assert.equal(view.data.filters[0].id, "filter-1");
    assert.equal(view.data.filters[0].$loki, undefined);

    const original = fake.state.logViews[0];
    fake.state.logViews = [];
    const missing = await call(client, "get_log_view", { project: "demo" });
    assert.equal(missing.isError, true);
    assert.match(missing.text, /no log view/i);

    fake.state.logViews = [original, { ...original, id: "view-2" }];
    const ambiguous = await call(client, "get_log_view", { project: "demo" });
    assert.equal(ambiguous.isError, true);
    assert.match(ambiguous.text, /multiple log views/i);
    assert.match(ambiguous.text, /view-1/);
    assert.match(ambiguous.text, /view-2/);
  } finally {
    await client.close();
    await fake.close();
  }
});

test("add_view_filter creates a simple filter and returns the latest view", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const result = await call(client, "add_view_filter", {
      project: "demo",
      filter: {
        property: "res.status",
        condition: "EQUAL",
        value: 200,
      },
    });
    assert.equal(result.isError, false, result.text);
    assert.equal(result.data.filter.type, "SIMPLE_FILTER");
    assert.equal(result.data.filter.property, "res.status");
    assert.equal(result.data.filter.activate, true);
    assert.equal(typeof result.data.filter.id, "string");
    assert.equal(result.data.logView.filters.length, 2);

    const request = fake.state.requests.find(
      (entry) => entry.method === "POST" && entry.path === "/api/logFilter/"
    );
    assert.equal(request.body.logViewId, "view-1");
    assert.equal(request.body.projectId, "project-1");
    assert.equal(request.body.filter.id, result.data.filter.id);
  } finally {
    await client.close();
    await fake.close();
  }
});

test("update_view_filter updates simple filters and refuses preset ids", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const updated = await call(client, "update_view_filter", {
      project: "demo",
      filterId: "filter-1",
      filter: {
        property: "req.method",
        condition: "EQUAL",
        value: "GET",
      },
    });
    assert.equal(updated.isError, false, updated.text);
    assert.equal(updated.data.filter.id, "filter-1");
    assert.equal(updated.data.filter.property, "req.method");
    assert.equal(updated.data.filter.activate, true);

    const request = fake.state.requests.find(
      (entry) =>
        entry.method === "POST" && entry.path === "/api/logFilter/filter-1"
    );
    assert.equal(request.body.filter.id, "filter-1");

    fake.state.logViews[0].filters.push({
      type: "PRESET_FILTER",
      name: "STATUS_CODE",
      id: "preset-1",
      property: "res.status",
      condition: "FAMILY",
      value: ["2xx"],
      activate: true,
    });
    const preset = await call(client, "update_view_filter", {
      project: "demo",
      filterId: "preset-1",
      filter: {
        property: "res.status",
        condition: "EQUAL",
        value: 200,
      },
    });
    assert.equal(preset.isError, true);
    assert.match(preset.text, /preset/i);
    assert.match(preset.text, /update_view_preset/);
  } finally {
    await client.close();
    await fake.close();
  }
});

test("delete_view_filter removes a filter and returns it", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const result = await call(client, "delete_view_filter", {
      project: "demo",
      filterId: "filter-1",
    });
    assert.equal(result.isError, false, result.text);
    assert.equal(result.data.removed.id, "filter-1");
    assert.equal(result.data.logView.filters.length, 0);

    const request = fake.state.requests.find(
      (entry) =>
        entry.method === "DELETE" &&
        entry.path === "/api/logFilter/filter-1"
    );
    assert.equal(request.query.logViewId, "view-1");
    assert.equal(request.query.projectId, "project-1");

    fake.state.logViews[0].filters.push({
      type: "PRESET_FILTER",
      name: "STATUS_CODE",
      id: "preset-1",
      property: "res.status",
      condition: "FAMILY",
      value: ["2xx"],
      activate: true,
    });
    const preset = await call(client, "delete_view_filter", {
      project: "demo",
      filterId: "preset-1",
    });
    assert.equal(preset.isError, false, preset.text);
    assert.equal(preset.data.removed.type, "PRESET_FILTER");
    assert.equal(preset.data.logView.filters.length, 0);
  } finally {
    await client.close();
    await fake.close();
  }
});

test("update_view_preset writes canonical presets and removes them", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const status = await call(client, "update_view_preset", {
      project: "demo",
      name: "STATUS_CODE",
      value: ["5xx"],
    });
    assert.equal(status.isError, false, status.text);
    assert.equal(status.data.filter.name, "STATUS_CODE");
    assert.equal(status.data.filter.property, "res.status");
    assert.equal(status.data.filter.condition, "FAMILY");
    assert.deepEqual(status.data.filter.value, ["5xx"]);

    const methods = await call(client, "update_view_preset", {
      project: "demo",
      name: "METHODS",
      value: ["GET", "POST"],
    });
    assert.equal(methods.isError, false, methods.text);
    assert.equal(methods.data.filter.property, "req.method");
    assert.equal(methods.data.filter.condition, "IN");

    const expectation = await call(client, "update_view_preset", {
      project: "demo",
      name: "EXPECTATION",
      value: "exp-1",
    });
    assert.equal(expectation.isError, false, expectation.text);
    assert.equal(expectation.data.filter.property, "expectationId");
    assert.equal(expectation.data.filter.condition, "EQUAL");

    const numericStatus = await call(client, "update_view_preset", {
      project: "demo",
      name: "STATUS_CODE",
      value: [404, "5xx"],
    });
    assert.equal(numericStatus.isError, false, numericStatus.text);
    assert.deepEqual(numericStatus.data.filter.value, ["404", "5xx"]);

    const removedMethods = await call(client, "update_view_preset", {
      project: "demo",
      name: "METHODS",
      value: "",
    });
    assert.equal(removedMethods.isError, false, removedMethods.text);
    assert.equal(removedMethods.data.filter, null);
    assert.ok(
      !removedMethods.data.logView.filters.some(
        (filter) =>
          filter.type === "PRESET_FILTER" && filter.name === "METHODS"
      )
    );

    const removed = await call(client, "update_view_preset", {
      project: "demo",
      name: "STATUS_CODE",
      value: [],
    });
    assert.equal(removed.isError, false, removed.text);
    assert.equal(removed.data.filter, null);
    assert.ok(
      !removed.data.logView.filters.some(
        (filter) =>
          filter.type === "PRESET_FILTER" && filter.name === "STATUS_CODE"
      )
    );

    const request = fake.state.requests
      .filter((entry) => entry.path === "/api/logFilter/updatePresetLogFilter")
      .at(-1);
    assert.equal(request.body.logViewId, "view-1");
    assert.equal(request.body.filter.type, "PRESET_FILTER");
  } finally {
    await client.close();
    await fake.close();
  }
});

test("update_view_preset rejects wrong value shapes", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const expectation = await call(client, "update_view_preset", {
      project: "demo",
      name: "EXPECTATION",
      value: ["exp-1"],
    });
    assert.equal(expectation.isError, true);
    assert.match(expectation.text, /EXPECTATION/);

    const methods = await call(client, "update_view_preset", {
      project: "demo",
      name: "METHODS",
      value: "GET",
    });
    assert.equal(methods.isError, true);
    assert.match(methods.text, /array/i);
  } finally {
    await client.close();
    await fake.close();
  }
});

test("view filter writes validate their input", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const preset = await call(client, "add_view_filter", {
      project: "demo",
      filter: {
        type: "PRESET_FILTER",
        property: "res.status",
        condition: "FAMILY",
        value: ["2xx"],
      },
    });
    assert.equal(preset.isError, true);

    const badProperty = await call(client, "add_view_filter", {
      project: "demo",
      filter: {
        property: "$or",
        condition: "EQUAL",
        value: "GET",
      },
    });
    assert.equal(badProperty.isError, true);
    assert.match(badProperty.text, /property/i);
  } finally {
    await client.close();
    await fake.close();
  }
});

test("filter_logs documents every comparator with examples", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const tools = await client.listTools();
    const tool = tools.tools.find((item) => item.name === "filter_logs");
    assert.ok(tool);
    assert.match(tool.description, /FAMILY/);
    assert.match(tool.description, /status famil/i);

    const schema = JSON.stringify(tool.inputSchema);
    for (const term of [
      "EQUAL",
      "NOT_EQUAL",
      "CONTAINS",
      "GREATER",
      "LESS",
      "IN",
      "FAMILY",
      "2xx",
      "res.status",
    ]) {
      assert.match(
        schema,
        new RegExp(term),
        `filter_logs schema should document ${term}`
      );
    }

    const addFilter = tools.tools.find(
      (item) => item.name === "add_view_filter"
    );
    assert.match(addFilter.description, /last-write-wins/i);
    assert.match(addFilter.description, /not atomic/i);
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
    assert.equal(names.length, 9);
    assert.ok(names.includes("list_expectations"));
    assert.ok(names.includes("filter_logs"));
    assert.ok(names.includes("get_log_view"));
    assert.ok(!names.includes("add_view_filter"));
    assert.ok(!names.includes("update_view_filter"));
    assert.ok(!names.includes("delete_view_filter"));
    assert.ok(!names.includes("update_view_preset"));
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

test("filter_logs forwards view-shaped filters to the filter endpoint", async () => {
  const fake = await startFakeLiveMock();
  const client = await connect({
    LIVEMOCK_URL: fake.url,
    LIVEMOCK_API_TOKEN: TOKEN,
  });
  try {
    const filters = [
      { property: "req.headers.authorization", condition: "CONTAINS", value: "Bearer" },
      { property: "res.status", condition: "FAMILY", value: ["2xx"] },
    ];
    const result = await call(client, "filter_logs", {
      project: "demo",
      filters,
      limit: 1,
      maxLogId: 100010,
      includeBody: true,
    });
    assert.equal(result.isError, false, result.text);
    assert.equal(result.data.hasMore, false);
    assert.equal(result.data.logs[0].method, "GET");
    assert.deepEqual(result.data.logs[0].responseBody, { id: 1 });

    const request = fake.state.requests.find(
      (entry) =>
        entry.method === "POST" && entry.path === "/api/log/queryByFilters"
    );
    assert.equal(request.body.projectId, "project-1");
    assert.deepEqual(request.body.filters, filters);
    assert.equal(request.body.limit, 1);
    assert.equal(request.body.maxLogId, 100010);
    assert.equal(request.body.includeBody, true);
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
