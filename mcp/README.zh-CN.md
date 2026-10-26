# livemock-mcp

<p>
  <a href="./README.md">English</a> | <strong>简体中文</strong>
</p>

面向 [LiveMock](https://github.com/alinGmail/LiveMock) 的 MCP server。它让 AI 客户端可以列出并管理 LiveMock 项目(project)、创建原始 expectation、控制分组(group)、读取请求记录(request log)以及导入 API 文档——全部通过正在运行的 LiveMock `/api` 控制面(control plane)完成。

> 本文的术语与主 [README.zh-CN.md](../README.zh-CN.md#中英术语对照) 一致：expectation、matcher、action、proxy 保留英文，通用概念使用中文。

## 环境要求

- Node.js 18 或更高版本。
- 一个正在运行的 LiveMock web 实例（默认 `http://localhost:9002`）。
- 在 LiveMock **Settings** 页面创建的 API 令牌(API token)。

## 1. 创建 API 令牌(API token)

打开 LiveMock → **Settings** → **API tokens** → **Create token**。

- 给它起个名字，例如 `claude-code` 或 `cursor`。
- 选择有效期，或保持 **Never**。
- 复制对话框中显示的令牌。它**只显示一次**；LiveMock 只保存哈希。
- 该令牌拥有项目、expectation、分组、日志和导入的完整权限，请像对待密码一样对待它。
- 停用某个客户端时，就在同一张卡片上吊销它的令牌。

令牌不能创建或吊销其他令牌，也不能修改账号密码；这些操作需要浏览器会话。

## 2. 配置客户端

server 会读取三个环境变量：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `LIVEMOCK_URL` | `http://localhost:9002` | LiveMock web 的源地址。末尾带 `/api` 也能识别。 |
| `LIVEMOCK_API_TOKEN` | *（必填）* | 在 Settings 页面创建的令牌。以 `Authorization: Bearer` 发送。 |
| `LIVEMOCK_MCP_READ_ONLY` | *（未设置）* | 设为 `1` 可隐藏写工具。这只是客户端的便利开关，**不是**安全边界。 |

### 用 add-mcp 一条命令安装

[`add-mcp`](https://github.com/neon-solutions/add-mcp) 会为 Claude Code、Claude Desktop、Cursor、OpenCode、VS Code 等客户端写入正确的配置。它会推断服务器名称为 `livemock`，并通过 `npx` 运行这个包。

```bash
npx add-mcp@2 livemock-mcp -g -a claude-code \
  --env 'LIVEMOCK_URL=http://localhost:9002' \
  --env 'LIVEMOCK_API_TOKEN=${LIVEMOCK_API_TOKEN}'
```

把 `-a claude-code` 换成 `-a cursor`、`-a opencode`，或追加多个 `-a` 标志。`${LIVEMOCK_API_TOKEN}` 外面套单引号会让 `add-mcp` 在安装过程中提示输入该值，因此令牌不会出现在你的 shell 历史记录里。

`-g` 写入用户级客户端配置。请保留它：项目模式会把 `.mcp.json` 或 `.cursor/mcp.json` 写进仓库，真实令牌可能因此被提交。`add-mcp` 把解析后的值直接存进该配置文件——它不会创建运行时环境变量引用——所以请使用可吊销的令牌，并且永远不要提交生成出来的配置文件。

要安装只读的 MCP server，加上 `--env 'LIVEMOCK_MCP_READ_ONLY=1'`。除非你确实希望客户端不经确认就执行 LiveMock 的写工具，否则不要使用 `--auto-approve`。

用下面的命令检查配置：

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

把下面的内容加入 `claude_desktop_config.json`：

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

把下面的内容加入 `~/.cursor/mcp.json`（或项目的 `.cursor/mcp.json`）：

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

## 工具

| 工具 | 权限 | 说明 |
|---|---|---|
| `list_projects` | 读 | 列出项目及其状态、端口和 mock 基地址。 |
| `get_project` | 读 | 按 id 或精确名称获取单个项目。 |
| `create_project` | 写 | 创建一个处于停止状态的项目。 |
| `update_project` | 写 | 修改名称、描述、端口或日志条数上限。 |
| `delete_project` | 写 | 删除一个已停止的项目。不可撤销。 |
| `start_project` | 写 | 启动 mock 监听器，返回 mock URL。 |
| `stop_project` | 写 | 停止 mock 监听器。 |
| `list_expectations` | 读 | 精简摘要；`full=true` 时返回原始对象。 |
| `get_expectation` | 读 | 按 id 获取完整的 expectation。 |
| `create_expectation` | 写 | 用原始 matchers 和 actions 创建。 |
| `update_expectation` | 写 | 原始对象的部分更新。 |
| `delete_expectation` | 写 | 按 id 删除。不可撤销。 |
| `list_groups` | 读 | 列出 expectation 分组(group)。 |
| `create_group` | 写 | 创建一个分组。 |
| `update_group` | 写 | 修改名称、启用状态或优先级(priority)。 |
| `delete_group` | 写 | 删除分组及其成员 expectation。 |
| `list_logs` | 读 | 按条件查询请求记录(request log)；只有 `includeBody=true` 时才返回请求体。 |
| `filter_logs` | 读 | 使用与日志视图(log view)相同的筛选器(filter)做临时查询；不会改动已保存的视图。 |
| `get_log_view` | 读 | 项目的已保存日志视图、其中的筛选器及其 id。 |
| `add_view_filter` | 写 | 向已保存视图添加简单筛选器(simple filter)。 |
| `update_view_filter` | 写 | 更新已保存视图中的简单筛选器。 |
| `delete_view_filter` | 写 | 删除已保存视图中的筛选器。 |
| `update_view_preset` | 写 | 设置或删除已保存视图的预设(preset)。 |
| `get_log` | 读 | 一条完整的请求/响应记录。 |
| `import_api_spec` | 写 | 导入 OpenAPI、Swagger 或 Postman 内容。 |

项目参数既接受 id，也接受精确名称。名称不存在时会返回可选的候选项。

## server 会告诉 AI 客户端什么

在 `initialize` 阶段，server 会发送一段 `instructions` 入门说明，包含领域模型（项目 → expectation → matcher/action → 分组 → 日志）、匹配顺序、标准工作流（发现、查看、写入、启动、验证）以及常见陷阱。每个工具也带有描述和自动生成的 JSON Schema（含字段级说明），因此模型在第一次调用之前就已有足够上下文。本 README 为人类读者覆盖同样的内容；如果两者不一致，以 `src/instructions.ts` 和 `src/schemas.ts` 为准。

## 概念模型

- **项目(project)** —— 一个独立端口的 mock 监听器（默认 `8088`），拥有自己的 expectation、分组和日志。它的状态是 `STOPPED` 或 `STARTED`；未启动之前不会提供任何服务。`mockBaseUrl` 是测试流量使用的地址，而 LiveMock 的 URL 是控制面。
- **expectation** —— 一条规则：当它的全部 matcher 都通过时，执行它的 action。字段包括 `priority`（更高者优先）、`delay`（毫秒）、`activate`、可选的 `groupId`、`matchers[]` 和 `actions[]`。没有 matcher 的 expectation 会匹配所有请求。
- **matcher** —— 针对请求的一个条件：`method`、`path`（仅 URL 路径，不含查询字符串）、`header`、`query` 或 `param`（JSON、urlencoded 或 multipart 请求体字段）。所有 matcher 必须全部通过。
- **action** —— `CUSTOM_RESPONSE`、`PROXY` 或 `STATIC_DIRECTORY`。LiveMock 目前只执行命中 expectation 的**第一个** action。
- **分组(group)** —— 一个可选的分组容器，有自己的 `activate` 和 `priority`。停用的分组会禁用其全部成员。
- **匹配顺序** —— 一个分组是一个整体块，按分组的 `(priority, createTime)` 降序排名；未分组的 expectation 自成一个块，并用它自己的 `(priority, createTime)` 作为该块的排名，因此会直接与分组竞争。成员的 priority 只决定它们在分组内部的顺序，无法把成员抬到其他块之前。先匹配到的胜出；priority 相同时，创建更晚的块胜出。
- **请求记录(request log)** —— mock 监听器处理的一条请求，包含命中的 `expectationId`、状态码、耗时和请求/响应体。`list_logs` 可按 `method`、`path`、`pathContains`、`status`（精确状态码或 `2xx` 这类区间）、`expectationId` 和请求时间过滤；条件之间是 AND，同一字段重复传值是 OR，且这些条件只是临时查询——不会改动 Web UI 使用的已保存日志视图。

典型流程：`list_projects` → 用 `list_expectations` / `get_expectation` / `list_groups` 查看 → `create_expectation` 或 `import_api_spec` → `start_project` → 向 `mockBaseUrl` 发送请求 → 用 `list_logs` / `get_log` 验证。

### 查询请求记录

`list_logs` 覆盖 method、path、status、`expectationId` 和请求时间。其他字段或条件用 `filter_logs`，它接受与已保存日志视图相同的筛选器：

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

常见 `property` 路径：`req.method`、`req.path`、`req.headers.<name>`、`req.query.<name>`、`req.body.<field>`、`res.status`、`res.duration`、`expectationId`、`req.requestTime`。

| 比较器(comparator) | 含义 | 示例 |
|---|---|---|
| `EQUAL` | 精确匹配；字符串区分大小写，数字字符串也能匹配对应数字。 | `{ "property": "req.method", "condition": "EQUAL", "value": "GET" }` |
| `NOT_EQUAL` | 与给定值不相等。 | `{ "property": "res.status", "condition": "NOT_EQUAL", "value": 200 }` |
| `CONTAINS` | 字符串子串匹配。 | `{ "property": "req.path", "condition": "CONTAINS", "value": "/users" }` |
| `GREATER` / `LESS` | 数值或字典序比较；时间字段接受 epoch 毫秒或 ISO-8601。 | `{ "property": "res.duration", "condition": "GREATER", "value": 1000 }` |
| `IN` | 匹配数组中的任意一个值。 | `{ "property": "req.method", "condition": "IN", "value": ["GET", "POST"] }` |
| `FAMILY` | 状态码区间；可以混入精确状态码，主要用于 `res.status`。 | `{ "property": "res.status", "condition": "FAMILY", "value": ["4xx", 500] }` |

`FAMILY` 把 `2xx` 视为 200–299、`5xx` 视为 500–599。只是按状态码分组过滤时，用 `list_logs.status` 更短。

条件之间是 AND，`activate: false` 会被跳过，不支持 `GROUP_FILTER`，不会读取或修改已保存的日志视图。

### 管理已保存的日志视图

已保存的日志视图(log view)是 Web UI 使用的持久化筛选器集合。`filter_logs` 不会修改它；下面的工具会。

- `get_log_view` —— 读取当前视图、其中的筛选器及其 id。
- `add_view_filter` / `update_view_filter` —— 只管理简单筛选器(simple filter)。`add` 在未提供 id 时生成一个；`update` 会拒绝 preset id。
- `delete_view_filter` —— 按 id 删除任意已保存筛选器。
- `update_view_preset` —— 设置或删除 `EXPECTATION`、`METHODS` 或 `STATUS_CODE` 预设(preset)。

`EXPECTATION` 接受 expectation id；`METHODS` 和 `STATUS_CODE` 接受数组。空字符串、null 或空数组表示删除该预设。

这些工具修改的是 Web UI 共用的视图。写入采用最后写入者覆盖，且不会实时刷新页面：重新加载日志页才能看到新筛选器。写入前先读取视图。项目必须恰好有一个日志视图；缺失或有多个都会报错。只读模式下不会注册写工具。

## 创建 expectation

expectation 使用 LiveMock 的**原始** matcher 和 action。MCP server 会补齐结构性缺省值（id、`conditions`、响应头和状态码），但不会凭空编造业务值。

一个按 method/path 匹配并返回自定义 JSON 的示例：

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

`responseContent.value` 是一个包含响应体的**字符串**。如果是 JSON，请把文档序列化。headers 是 `[name, value]` 形式的键值对。

一个 proxy expectation：

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

支持的 matcher 类型：`method`、`path`（仅 URL 路径，不含查询字符串）、`header`、`query`、`param`。
支持的比较器(comparator)：`IS`、`IS_NOT`、`CONTAINS`、`NOT_CONTAINS`、`START_WITH`、`END_WITH`、`MATCH_REGEX`、`NOT_MATCH_REGEX`、`SHOWED`、`NOT_SHOWED`、`MATCH_GLOB`、`NO_MATCH_GLOB`。`SHOWED` / `NOT_SHOWED` 是存在性检查，会忽略 `value`。
支持的 action 类型：`CUSTOM_RESPONSE`、`PROXY`、`STATIC_DIRECTORY`。mock 引擎目前只执行**第一个** action。对于 `PROXY`，`prefixRemove` 会在转发前剥掉路径前缀；`pathRewrite` 为了兼容性可以接受，但当前引擎不会应用它。

`delay` 的单位是毫秒，在响应之前生效。priority 更高的规则先被匹配；priority 相同时，创建更晚的规则胜出。一个分组作为一个整体块参与排名，停用的分组会禁用其全部成员 expectation。`activate: false` 的 expectation 永远不会触发。

对于 `CUSTOM_RESPONSE`，`responseContent.type` 决定生成的 `Content-Type`（`JSON` → `application/json`，`TEXT` → `text/plain`），显式设置的 `headers` 会覆盖它。把 `responseContent.contentHandler` 设为 `MOCK_JS`，就会把 `value` 当作 [Mock.js](http://mockjs.com/) JSON 模板来解释。

创建 expectation 不会启动项目；之后还需要调用 `start_project`。

## 只读模式

```bash
LIVEMOCK_MCP_READ_ONLY=1 npx -y livemock-mcp
```

这会从 `tools/list` 中移除写工具。它不会降低令牌在服务端的权限。需要真正做访问控制时，请使用单独的令牌并在用完后吊销。

## 安全说明

- 令牌在存储时是哈希值，且只显示一次。MCP server 从不记录令牌。
- 令牌可以操作数据面，但不能管理令牌或修改密码。
- 修改账号密码或运行 `livemock reset-admin` 会吊销所有令牌。
- 不要把令牌放进会被提交的客户端配置文件。客户端支持密钥或环境变量展开时，优先使用它们。

## 开发

在仓库根目录执行：

```bash
yarn workspace livemock-core build  # web 后端消费的是 core 的编译产物
yarn workspace livemock-mcp build   # 编译到 dist/
yarn workspace livemock-mcp test    # 伪造的 LiveMock HTTP server + SDK stdio 客户端
yarn workspace livemock-mcp e2e     # 用临时数据库启动真实后端
```

端到端脚本会注册账号、创建令牌、创建项目和一条原始 expectation、启动 mock 监听器、发送真实请求、读取记录、清理，最后验证吊销。

## 疑难排查

| 现象 | 原因 / 解决办法 |
|---|---|
| `401` / "rejected the API token" | 令牌错误、已过期或已被吊销。请在 Settings 页面重新创建。 |
| 令牌管理接口返回 `403` | 属于预期行为：令牌管理需要浏览器会话。 |
| `Could not reach LiveMock` | 检查 `LIVEMOCK_URL`，并确认 web 服务正在运行。 |
| "project is STARTED can not modify port" | 修改端口前先停止项目。 |
| 删除时报 "project status is STARTED" | 删除前先停止项目。 |
