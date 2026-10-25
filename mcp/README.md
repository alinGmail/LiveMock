# livemock-mcp

<p>
  <strong>English</strong> | <a href="./README.zh-CN.md">简体中文</a>
</p>

MCP server for [LiveMock](https://github.com/alinGmail/LiveMock). It lets an AI client list and manage LiveMock projects, create raw expectations, control groups, read request logs and import API documents — all through the running LiveMock `/api` control plane.

## Requirements

- Node.js 18 or newer.
- A running LiveMock web instance (default `http://localhost:9002`).
- An API token created on the LiveMock **Settings** page.

## 1. Create an API token

Open LiveMock → **Settings** → **API tokens** → **Create token**.

- Give it a name such as `claude-code` or `cursor`.
- Choose an expiry, or leave it as **Never**.
- Copy the token shown in the dialog. It is displayed **once**; LiveMock stores only a hash.
- The token has full access to projects, expectations, groups, logs and imports. Treat it like a password.
- Revoke it from the same card when a client is retired.

Tokens cannot create or revoke other tokens and cannot change the account password. Those actions require a browser session.

## 2. Configure the client

The server reads three environment variables:

| Variable | Default | Description |
|---|---|---|
| `LIVEMOCK_URL` | `http://localhost:9002` | LiveMock web origin. A trailing `/api` is tolerated. |
| `LIVEMOCK_API_TOKEN` | *(required)* | Token created on the Settings page. Sent as `Authorization: Bearer`. |
| `LIVEMOCK_MCP_READ_ONLY` | *(unset)* | Set to `1` to hide write tools. This is a client-side convenience, **not** a security boundary. |

### One-command install with add-mcp

[`add-mcp`](https://github.com/neon-solutions/add-mcp) writes the right configuration for Claude Code, Claude Desktop, Cursor, OpenCode, VS Code and other clients. It infers the server name `livemock` and runs the package through `npx`.

```bash
npx add-mcp@2 livemock-mcp -g -a claude-code \
  --env 'LIVEMOCK_URL=http://localhost:9002' \
  --env 'LIVEMOCK_API_TOKEN=${LIVEMOCK_API_TOKEN}'
```

Replace `-a claude-code` with `-a cursor`, `-a opencode`, or add several `-a` flags. The single-quoted `${LIVEMOCK_API_TOKEN}` makes `add-mcp` prompt for the value during installation, so the token does not appear in your shell history.

`-g` writes the user-level client configuration. Keep it: project mode writes `.mcp.json` or `.cursor/mcp.json` inside the repository, where a real token could be committed. `add-mcp` stores the resolved value in that config file — it does not create a runtime environment reference — so use a revocable token and never commit the generated file.

To install a read-only MCP server, add `--env 'LIVEMOCK_MCP_READ_ONLY=1'`. Avoid `--auto-approve` unless you deliberately want the client to run LiveMock's write tools without confirmation.

Verify the configuration with:

```bash
npx add-mcp@2 list -g -a claude-code
```

### Claude Code

```bash
claude mcp add livemock \
  -e LIVEMOCK_URL=http://localhost:9002 \
  -e LIVEMOCK_API_TOKEN=lmk_replace_me \
  -- npx -y livemock-mcp
```

### Claude Desktop

Add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "livemock": {
      "command": "npx",
      "args": ["-y", "livemock-mcp"],
      "env": {
        "LIVEMOCK_URL": "http://localhost:9002",
        "LIVEMOCK_API_TOKEN": "lmk_replace_me"
      }
    }
  }
}
```

### Cursor

Add this to `~/.cursor/mcp.json` (or the project's `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "livemock": {
      "command": "npx",
      "args": ["-y", "livemock-mcp"],
      "env": {
        "LIVEMOCK_URL": "http://localhost:9002",
        "LIVEMOCK_API_TOKEN": "lmk_replace_me"
      }
    }
  }
}
```

## Tools

| Tool | Access | Description |
|---|---|---|
| `list_projects` | read | List projects with status, port and mock base URL. |
| `get_project` | read | Get one project by id or exact name. |
| `create_project` | write | Create a stopped project. |
| `update_project` | write | Change name, description, port or max log count. |
| `delete_project` | write | Delete a stopped project. Irreversible. |
| `start_project` | write | Start the mock listener; returns the mock URL. |
| `stop_project` | write | Stop the mock listener. |
| `list_expectations` | read | Compact summaries; `full=true` for raw objects. |
| `get_expectation` | read | Full expectation by id. |
| `create_expectation` | write | Create from raw matchers and actions. |
| `update_expectation` | write | Raw partial update. |
| `delete_expectation` | write | Delete by id. Irreversible. |
| `list_groups` | read | List expectation groups. |
| `create_group` | write | Create a group. |
| `update_group` | write | Change name, activation or priority. |
| `delete_group` | write | Delete a group and its member expectations. |
| `list_logs` | read | Filtered request logs; bodies only with `includeBody=true`. |
| `filter_logs` | read | Advanced ad-hoc query with log-view-shaped filters; saved views are untouched. |
| `get_log` | read | One full request/response log. |
| `import_api_spec` | write | Import OpenAPI, Swagger or Postman content. |

Project arguments accept either an id or an exact name. Unknown names return the available candidates.

## What the AI client is told

On `initialize` the server sends an `instructions` primer with the domain model (project → expectation → matcher/action → group → log), match order, the standard workflow (discover, inspect, write, start, verify) and common pitfalls. Each tool also carries a description and a generated JSON Schema with field-level notes, so the model has enough context even before its first call. This README covers the same ground for humans; if the two disagree, `src/instructions.ts` and `src/schemas.ts` are authoritative.

## Concept model

- **Project** — one mock listener on its own port (default `8088`) with its own expectations, groups and logs. It is `STOPPED` or `STARTED`; nothing is served until it is started. `mockBaseUrl` is the address for test traffic, while the LiveMock URL is the control plane.
- **Expectation** — one rule: when all of its matchers pass, its action runs. Fields include `priority` (higher wins), `delay` (milliseconds), `activate`, optional `groupId`, `matchers[]` and `actions[]`. An expectation with no matchers matches every request.
- **Matcher** — one condition on the request: `method`, `path` (URL path only, no query string), `header`, `query` or `param` (JSON, urlencoded or multipart body field). All matchers must pass.
- **Action** — `CUSTOM_RESPONSE`, `PROXY` or `STATIC_DIRECTORY`. LiveMock currently executes the **first** action of a matched expectation.
- **Group** — an optional bucket with its own `activate` and `priority`. An inactive group disables all its members.
- **Match order** — a group is one block ranked by the group's `(priority, createTime)` descending; an ungrouped expectation is its own block and uses its own `(priority, createTime)` as that block's rank, so it competes directly with groups. Member priorities only order expectations inside their group and cannot lift a member above another block. The first match wins, and a later-created block wins a priority tie.
- **Request log** — one request handled by the mock listener, including the matched `expectationId`, status, duration and bodies. `list_logs` filters by `method`, `path`, `pathContains`, `status` (an exact code or a family such as `2xx`), `expectationId` and request time; conditions are ANDed, repeated values are ORed, and the filters are ad-hoc — they never change the saved log views the web UI uses.

Typical flow: `list_projects` → inspect with `list_expectations` / `get_expectation` / `list_groups` → `create_expectation` or `import_api_spec` → `start_project` → send a request to `mockBaseUrl` → verify with `list_logs` / `get_log`.

### Querying logs

`list_logs` covers method, path, status, `expectationId` and request time. For any other field or condition, `filter_logs` accepts the same filter objects as saved log views:

```json
{
  "project": "demo",
  "filters": [
    { "property": "req.headers.authorization", "condition": "CONTAINS", "value": "Bearer" },
    { "property": "res.status", "condition": "FAMILY", "value": ["5xx"] }
  ],
  "limit": 20
}
```

Filters are ANDed, `activate: false` is skipped, `GROUP_FILTER` is not supported, and the saved log view is never read or written.

## Creating an expectation

Expectations use LiveMock's **raw** matchers and actions. The MCP server fills structural omissions (ids, `conditions`, response headers and status) but does not invent business values.

A method/path match with a custom JSON response:

```json
{
  "project": "demo",
  "expectation": {
    "name": "GET /users/1",
    "activate": true,
    "priority": 0,
    "delay": 0,
    "matchers": [
      { "type": "method", "conditions": "IS", "value": "GET" },
      { "type": "path", "conditions": "IS", "value": "/users/1" }
    ],
    "actions": [
      {
        "type": "CUSTOM_RESPONSE",
        "status": 200,
        "responseContent": {
          "type": "JSON",
          "value": "{\"id\":1,\"name\":\"Tom\"}",
          "headers": [["content-type", "application/json"]]
        }
      }
    ]
  }
}
```

`responseContent.value` is a **string** containing the response body. For JSON, stringify the document. Headers are `[name, value]` pairs.

A proxy expectation:

```json
{
  "project": "demo",
  "expectation": {
    "name": "Proxy /api",
    "matchers": [
      { "type": "path", "conditions": "START_WITH", "value": "/api/" }
    ],
    "actions": [
      {
        "type": "PROXY",
        "protocol": "http",
        "host": "http://localhost:3000"
      }
    ]
  }
}
```

Supported matcher types: `method`, `path` (URL path only, query string excluded), `header`, `query`, `param`.
Supported conditions: `IS`, `IS_NOT`, `CONTAINS`, `NOT_CONTAINS`, `START_WITH`, `END_WITH`, `MATCH_REGEX`, `NOT_MATCH_REGEX`, `SHOWED`, `NOT_SHOWED`, `MATCH_GLOB`, `NO_MATCH_GLOB`. `SHOWED` / `NOT_SHOWED` are presence checks and ignore `value`.
Supported action types: `CUSTOM_RESPONSE`, `PROXY`, `STATIC_DIRECTORY`. The mock engine currently executes the **first** action only. For `PROXY`, `prefixRemove` strips a path prefix before forwarding; `pathRewrite` is accepted for compatibility but is not applied by the current engine.

`delay` is in milliseconds and is applied before the response. Higher `priority` is matched first; among equal priorities the more recently created rule wins. A group is ranked as one block, and an inactive group disables all its member expectations. An expectation with `activate: false` never fires.

For `CUSTOM_RESPONSE`, `responseContent.type` controls the generated `Content-Type` (`JSON` → `application/json`, `TEXT` → `text/plain`), and explicit `headers` override it. Set `responseContent.contentHandler` to `MOCK_JS` to interpret `value` as a [Mock.js](http://mockjs.com/) JSON template.

Creating an expectation does not start the project; call `start_project` afterwards.

## Read-only mode

```bash
LIVEMOCK_MCP_READ_ONLY=1 npx -y livemock-mcp
```

This removes write tools from `tools/list`. It does not reduce the token's permissions on the server. Use a separate token and revoke it when you need real access control.

## Security notes

- Tokens are hashed at rest and shown only once. The MCP server never logs the token.
- A token can drive the data plane but cannot manage tokens or change the password.
- Changing the account password or running `livemock reset-admin` revokes every token.
- Keep tokens out of committed client configuration files. Prefer your client's secret or environment expansion where available.

## Development

From the repository root:

```bash
yarn workspace livemock-core build  # the web backend consumes core's compiled output
yarn workspace livemock-mcp build   # compile to dist/
yarn workspace livemock-mcp test    # fake LiveMock HTTP server, SDK stdio client
yarn workspace livemock-mcp e2e     # starts a real backend with a temporary database
```

The end-to-end script registers an account, creates a token, creates a project and a raw expectation, starts the mock listener, sends a real request, reads the log, cleans up, then proves revocation.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `401` / "rejected the API token" | Token is wrong, expired or revoked. Create a new one on Settings. |
| `403` on token management | Expected: token management requires a browser session. |
| `Could not reach LiveMock` | Check `LIVEMOCK_URL` and that the web server is running. |
| "project is STARTED can not modify port" | Stop the project before changing its port. |
| "project status is STARTED" on delete | Stop the project before deleting it. |
