import { getConfig } from "../config/config";
import {
  getExpectationCollection,
  getLogCollection,
  getLogDb,
  getProjectCollection,
  saveAndCloseProjectDb,
} from "../db/dbManager";
import {
  createLog,
  createRequestLog,
  createResponseLog,
  LogM,
  ParsedQs,
  WebsocketMessageM,
  WebsocketStatus,
} from "livemock-core/struct/log";

/**
 * Seed a project's request log with a variety of captured requests, for
 * exercising the Request Log page in development. The backend must be stopped
 * (LokiJS autosave would overwrite otherwise). Mirrors the reset-admin pattern.
 */

type Pair = [string, string];

interface LogSpec {
  method: string;
  path: string;
  status: number | null;
  statusMessage?: string;
  duration?: number;
  query?: Record<string, string>;
  reqBody?: unknown;
  reqHeaders?: Array<Pair>;
  resBody?: unknown;
  resHeaders?: Array<Pair>;
  expectationName?: string;
  proxy?: { host: string; path: string; reqHeaders?: Array<Pair>; resHeaders?: Array<Pair> };
  wsMessages?: Array<{ fromClient: boolean; content: string }>;
}

const LOG_SPECS: Array<LogSpec> = [
  {
    method: "POST",
    path: "/api/login",
    status: 200,
    statusMessage: "OK",
    duration: 12,
    reqBody: { username: "jane", password: "secret" },
    reqHeaders: [["content-type", "application/json"], ["host", "localhost:8088"]],
    resBody: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6…", expiresIn: 3600 },
    resHeaders: [["content-type", "application/json"]],
    expectationName: "login success",
  },
  {
    method: "POST",
    path: "/api/login",
    status: 401,
    statusMessage: "Unauthorized",
    duration: 3,
    reqBody: { username: "jane", password: "wrong" },
    reqHeaders: [["content-type", "application/json"], ["host", "localhost:8088"]],
    resBody: { error: "invalid_credentials" },
    resHeaders: [["content-type", "application/json"]],
    expectationName: "invalid credentials",
  },
  {
    method: "POST",
    path: "/api/refresh",
    status: 200,
    statusMessage: "OK",
    duration: 8,
    reqHeaders: [["authorization", "Bearer eyJ…"], ["content-type", "application/json"]],
    resBody: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6…" },
    resHeaders: [["content-type", "application/json"]],
    expectationName: "token refresh",
  },
  {
    method: "POST",
    path: "/api/checkout",
    status: 402,
    statusMessage: "Payment Required",
    duration: 5,
    query: {},
    reqBody: { amount: 4200, currency: "usd", card: "4000000000000002" },
    reqHeaders: [["content-type", "application/json"], ["host", "localhost:8088"]],
    resBody: { decline_code: "card_declined" },
    resHeaders: [["content-type", "application/json"], ["content-length", "34"]],
    expectationName: "card declined",
  },
  {
    method: "POST",
    path: "/api/checkout",
    status: null,
    query: { simulate: "timeout" },
    reqBody: { amount: 4200, currency: "usd" },
    reqHeaders: [["content-type", "application/json"], ["authorization", "Bearer sk_test_…"]],
    expectationName: "checkout timeout",
    proxy: {
      host: "https://api.stripe.com",
      path: "/v1/charges",
      reqHeaders: [["content-type", "application/json"]],
      resHeaders: [],
    },
  },
  {
    method: "GET",
    path: "/posts/5",
    status: 200,
    statusMessage: "OK",
    duration: 132,
    reqHeaders: [["accept", "application/json"], ["user-agent", "curl/8.4.0"]],
    resBody: {
      userId: 1,
      id: 5,
      title: "nesciunt quas odio",
      body: "repudiandae veniam quaerat sunt sed alias aut fugiat sit autem sed est",
    },
    resHeaders: [["content-type", "application/json; charset=utf-8"], ["content-length", "292"]],
    expectationName: "checkout timeout",
    proxy: {
      host: "https://jsonplaceholder.typicode.com",
      path: "/posts/5",
      reqHeaders: [["accept", "application/json"]],
      resHeaders: [["content-type", "application/json; charset=utf-8"]],
    },
  },
  {
    method: "GET",
    path: "/static/logo.svg",
    status: 200,
    statusMessage: "OK",
    duration: 2,
    reqHeaders: [["accept", "image/svg+xml"]],
    resBody: '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">…</svg>',
    resHeaders: [["content-type", "image/svg+xml"], ["content-length", "2301"]],
    expectationName: "static assets",
  },
  {
    method: "GET",
    path: "/chat",
    status: 101,
    statusMessage: "Switching Protocols",
    duration: 41200,
    reqHeaders: [["connection", "Upgrade"], ["upgrade", "websocket"]],
    resHeaders: [["upgrade", "websocket"], ["connection", "Upgrade"]],
    wsMessages: [
      { fromClient: true, content: '{"type":"join","room":"lobby"}' },
      { fromClient: false, content: '{"type":"joined","users":3}' },
      { fromClient: true, content: '{"type":"message","text":"hello"}' },
      { fromClient: false, content: '{"type":"message","from":"bob","text":"hi there"}' },
    ],
  },
  {
    method: "GET",
    path: "/api/heavy",
    status: 500,
    statusMessage: "Internal Server Error",
    duration: 1204,
    reqHeaders: [["user-agent", "PostmanRuntime/7.39.0"]],
    resBody: { error: "internal_error", message: "upstream timeout" },
    resHeaders: [["content-type", "application/json"], ["x-powered-by", "Express"]],
    expectationName: "fallback response",
  },
  {
    method: "PUT",
    path: "/api/profile",
    status: 200,
    statusMessage: "OK",
    duration: 11,
    reqBody: { displayName: "Jane Doe", email: "jane@example.com" },
    reqHeaders: [["content-type", "application/json"], ["authorization", "Bearer …"]],
    resBody: { ok: true, updatedAt: new Date().toISOString() },
    resHeaders: [["content-type", "application/json"]],
  },
  {
    method: "GET",
    path: "/not-found",
    status: 404,
    statusMessage: "Not Found",
    duration: 2,
    reqHeaders: [["accept", "text/plain"]],
    resBody: '{"message":"not found"}',
    resHeaders: [["content-type", "text/plain"]],
    expectationName: "404 example",
  },
  {
    method: "GET",
    path: "/ping",
    status: 200,
    statusMessage: "OK",
    duration: 1,
    reqHeaders: [["accept", "*/*"]],
    resBody: "pong",
    resHeaders: [["content-type", "text/plain"]],
    expectationName: "legacy ping",
  },
  {
    method: "DELETE",
    path: "/api/session",
    status: 204,
    statusMessage: "No Content",
    duration: 7,
    reqHeaders: [["authorization", "Bearer …"]],
    resHeaders: [["content-type", "application/json"]],
  },
];

export interface SeedLogsResult {
  projectId: string;
  logs: number;
}

function toHeaderObject(pairs: Array<Pair> | undefined) {
  return Object.fromEntries(pairs ?? []);
}

export async function seedLogs(
  dbPath: string,
  projectNameOrId: string,
  reset = true,
): Promise<SeedLogsResult> {
  const projectCollection = await getProjectCollection(dbPath);
  const project =
    projectCollection.findOne({ name: projectNameOrId }) ??
    projectCollection.findOne({ id: projectNameOrId });
  if (!project) {
    const names = projectCollection
      .find({})
      .map((item) => `${item.name} (${item.id})`)
      .join(", ");
    throw new Error(
      `project "${projectNameOrId}" not found. existing projects: ${names || "none"}`,
    );
  }
  const projectId = project.id;

  const expectationCollection = await getExpectationCollection(projectId, dbPath);
  const nameToId = new Map<string, string>();
  expectationCollection.find({}).forEach((expectation) => {
    nameToId.set(expectation.name, expectation.id);
  });

  const logDb = await getLogDb(projectId, dbPath);
  const logCollection =
    logDb.getCollection<LogM>("log") ?? logDb.addCollection<LogM>("log");
  if (reset) {
    logCollection.clear();
  }

  const now = Date.now();
  const logs = LOG_SPECS.map((spec, index) => {
    const log = createLog(index + 1);
    const req = createRequestLog();
    req.method = spec.method;
    req.path = spec.path;
    req.query = (spec.query ?? {}) as ParsedQs;
    req.body = (spec.reqBody ?? null) as unknown;
    req.rawBody = spec.reqBody != null ? JSON.stringify(spec.reqBody) : null;
    req.headers = toHeaderObject(spec.reqHeaders);
    req.requestTime = now - (LOG_SPECS.length - index) * 1000;
    req.requestTimeStr = new Date(req.requestTime).toISOString();
    log.req = req;

    if (spec.status != null) {
      const res = createResponseLog();
      res.status = spec.status;
      res.statusMessage = spec.statusMessage ?? "";
      res.duration = spec.duration ?? 0;
      res.headers = toHeaderObject(spec.resHeaders);
      res.body = spec.resBody ?? null;
      res.rawBody =
        typeof spec.resBody === "string"
          ? spec.resBody
          : spec.resBody != null
            ? JSON.stringify(spec.resBody)
            : null;
      res.responseTime = req.requestTime + res.duration;
      res.responseTimeStr = new Date(res.responseTime).toISOString();
      log.res = res;
    }

    if (spec.proxy) {
      log.proxyInfo = {
        isProxy: true,
        proxyHost: spec.proxy.host,
        proxyPath: spec.proxy.path,
        requestHeaders: (spec.proxy.reqHeaders ?? []).map(([name, value]) => ({
          name,
          value,
        })),
        responseHeaders: (spec.proxy.resHeaders ?? []).map(([name, value]) => ({
          name,
          value,
        })),
      };
    }

    if (spec.wsMessages) {
      log.websocketInfo = {
        isWebsocket: true,
        status: WebsocketStatus.OPEN,
        messages: spec.wsMessages.map(
          (message): WebsocketMessageM => ({
            sendTime: req.requestTime,
            sendFromClient: message.fromClient,
            isBinary: false,
            content: message.content,
            exceededMaxLength: false,
          }),
        ),
      };
    }

    log.expectationId = spec.expectationName
      ? nameToId.get(spec.expectationName) ?? null
      : null;

    logCollection.insert(log);
    return log;
  });

  await new Promise<void>((resolve, reject) => {
    logDb.saveDatabase((error) => (error ? reject(error) : resolve()));
  }).then(() => {
    logDb.close();
  });
  await saveAndCloseProjectDb(dbPath);

  return { projectId, logs: logs.length };
}

async function main() {
  const args = process.argv.slice(2);
  const projectNameOrId = args.find((arg) => !arg.startsWith("--"));
  if (!projectNameOrId) {
    console.error(
      "usage: yarn workspace livemock seed-logs <project-name-or-id> [--no-reset]",
    );
    process.exit(1);
  }
  const reset = !args.includes("--no-reset");
  const config = getConfig();
  const result = await seedLogs(config.database.path, projectNameOrId, reset);
  process.stdout.write(
    `seeded ${result.logs} request logs into project ${result.projectId}\n` +
      "start the backend again to see them\n",
    () => process.exit(0),
  );
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`, () => process.exit(1));
  });
}
