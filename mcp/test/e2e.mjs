import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const BACKEND_DIR = path.join(ROOT, "backEnd");
const TS_NODE_BIN = path.join(ROOT, "node_modules", "ts-node", "dist", "bin.js");
const MCP_ENTRY = fileURLToPath(new URL("../dist/index.js", import.meta.url));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function readResponse(response) {
  const text = await response.text();
  let body = text;
  try {
    body = JSON.parse(text);
  } catch {
    // plain text response
  }
  return { status: response.status, body, headers: response.headers };
}

async function startBackend(port, dbPath) {
  const child = spawn(process.execPath, [TS_NODE_BIN, "src/index.ts"], {
    cwd: BACKEND_DIR,
    env: {
      ...process.env,
      LIVEMOCK_PORT: String(port),
      LIVEMOCK_DB_PATH: dbPath,
      LIVEMOCK_COOKIE_SECURE: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    output += chunk;
  });

  const deadline = Date.now() + 30_000;
  while (!output.includes(`server start on ${port}`)) {
    if (child.exitCode !== null) {
      throw new Error(`backend exited early:\n${output}`);
    }
    if (Date.now() > deadline) {
      throw new Error(`backend did not start:\n${output}`);
    }
    await sleep(100);
  }
  return { child, output: () => output };
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null) {
    return;
  }
  child.kill("SIGTERM");
  const deadline = Date.now() + 3_000;
  while (child.exitCode === null && Date.now() < deadline) {
    await sleep(100);
  }
  if (child.exitCode === null) {
    child.kill("SIGKILL");
  }
}

async function connectMcp(baseUrl, token) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [MCP_ENTRY],
    env: {
      ...process.env,
      LIVEMOCK_URL: baseUrl,
      LIVEMOCK_API_TOKEN: token,
    },
    stderr: "pipe",
  });
  const client = new Client({ name: "livemock-e2e", version: "1.0.0" });
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

async function main() {
  const dbPath = await fs.mkdtemp(path.join(os.tmpdir(), "livemock-mcp-e2e-"));
  const webPort = await freePort();
  const mockPort = await freePort();
  const baseUrl = `http://127.0.0.1:${webPort}`;
  let backend;
  let client;

  try {
    backend = await startBackend(webPort, dbPath);

    const register = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: "e2e",
        password: "password123",
      }),
    });
    assert.equal(register.status, 200, "account registration failed");
    const setCookie =
      register.headers.getSetCookie?.()[0] ??
      register.headers.get("set-cookie");
    assert.ok(setCookie, "registration did not set a session cookie");
    const cookie = setCookie.split(";")[0];

    const tokenResponse = await fetch(`${baseUrl}/api/auth/tokens`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ name: "e2e", expiresInDays: 1 }),
    });
    const tokenBody = await readResponse(tokenResponse);
    assert.equal(tokenBody.status, 200, "token creation failed");
    const token = tokenBody.body.token;
    assert.match(token, /^lmk_/);

    const forbidden = await fetch(`${baseUrl}/api/auth/tokens`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ name: "forged" }),
    });
    assert.equal(
      forbidden.status,
      403,
      "a bearer token must not be able to create tokens"
    );

    client = await connectMcp(baseUrl, token);

    const projectName = `e2e-${Date.now()}`;
    const project = await call(client, "create_project", {
      name: projectName,
      description: "MCP end-to-end verification",
      port: mockPort,
    });
    assert.equal(project.isError, false, project.text);
    assert.equal(project.data.mockBaseUrl, `http://127.0.0.1:${mockPort}`);

    const expectation = await call(client, "create_expectation", {
      project: projectName,
      expectation: {
        name: "GET /e2e",
        matchers: [
          { type: "method", value: "GET" },
          { type: "path", value: "/e2e" },
        ],
        actions: [
          {
            type: "CUSTOM_RESPONSE",
            responseContent: { value: '{"ok":true}' },
          },
        ],
      },
    });
    assert.equal(expectation.isError, false, expectation.text);
    assert.ok(expectation.data.id);

    const started = await call(client, "start_project", {
      project: projectName,
    });
    assert.equal(started.isError, false, started.text);

    const mockResponse = await fetch(`http://127.0.0.1:${mockPort}/e2e`);
    assert.equal(mockResponse.status, 200, "mock did not respond");
    assert.deepEqual(await mockResponse.json(), { ok: true });

    let log;
    for (let attempt = 0; attempt < 30 && !log; attempt++) {
      const logs = await call(client, "list_logs", {
        project: projectName,
        includeBody: true,
      });
      assert.equal(logs.isError, false, logs.text);
      log = logs.data.find((entry) => entry.path === "/e2e");
      if (!log) {
        await sleep(100);
      }
    }
    assert.ok(log, "the mock request was not captured in the request log");
    assert.equal(log.status, 200);

    const stopped = await call(client, "stop_project", {
      project: projectName,
    });
    assert.equal(stopped.isError, false, stopped.text);

    const deleted = await call(client, "delete_project", {
      project: projectName,
    });
    assert.equal(deleted.isError, false, deleted.text);

    const revoke = await fetch(
      `${baseUrl}/api/auth/tokens/${tokenBody.body.id}`,
      { method: "DELETE", headers: { cookie } }
    );
    assert.equal(revoke.status, 200, "token revocation failed");

    const revoked = await call(client, "list_projects");
    assert.equal(revoked.isError, true);
    assert.match(revoked.text, /401/);

    console.log("end-to-end MCP verification passed");
  } finally {
    if (client) {
      await client.close().catch(() => undefined);
    }
    await stopProcess(backend?.child);
    await fs.rm(dbPath, { recursive: true, force: true });
    if (backend && !backend.output().includes("server start")) {
      console.error(backend.output());
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
