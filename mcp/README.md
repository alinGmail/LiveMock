# livemock-mcp

MCP server for the **web version** of [LiveMock](https://github.com/alinGmail/LiveMock). It lets an AI client list and manage LiveMock projects, create raw expectations, control groups, read request logs and import API documents — all through the running LiveMock `/api` control plane.

The desktop version is not supported: it has no login and no control-plane HTTP server.

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
| `list_logs` | read | Recent request logs; bodies only with `includeBody=true`. |
| `get_log` | read | One full request/response log. |
| `import_api_spec` | write | Import OpenAPI, Swagger or Postman content. |

Project arguments accept either an id or an exact name. Unknown names return the available candidates.

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

Supported matcher types: `method`, `path`, `header`, `query`, `param`.
Supported conditions: `IS`, `IS_NOT`, `CONTAINS`, `NOT_CONTAINS`, `START_WITH`, `END_WITH`, `MATCH_REGEX`, `NOT_MATCH_REGEX`, `SHOWED`, `NOT_SHOWED`, `MATCH_GLOB`, `NO_MATCH_GLOB`.
Supported action types: `CUSTOM_RESPONSE`, `PROXY`, `STATIC_DIRECTORY`.

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
