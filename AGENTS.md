# LiveMock

Mock-server tool shipped as two flavors: **web** (backEnd + frontEnd) and **desktop** (Electron). Yarn 4 workspaces; enable with `corepack enable` first, then `yarn install` (a forked LokiJS git dep is pinned by commit in `backEnd/package.json` and `desktop/package.json`).

## Workspace layout (dir ≠ package name)

| dir | yarn workspace | role |
|---|---|---|
| `core/` | `livemock-core` | shared TS types + pure helpers (params/response/event structs, match-order comparator) |
| `backEnd/` | `back-end` | web REST (mounted at `/api`) + Socket.IO server (ts-node, port from `LIVEMOCK_PORT`, default 9002) |
| `frontEnd/` | `front-end` | web UI (React + Vite, superagent + socket.io-client) |
| `desktop/` | `livemock` | Electron app: main process in `desktop/electron/`, renderer in `desktop/src/` |

## Key commands (run from repo root)

- `yarn web-dev` — dev backend on `LIVEMOCK_PORT` (default 9002) + Vite front-end on :5173. The front-end builds every REST and Socket.IO path from the `ServerUrl` constant (`/api`); Vite proxies `/api` (websocket upgrade included) to the backend (`frontEnd/vite.config.ts`).
- `yarn web-build` then `yarn web-start` — prod web; backend serves the built UI at `/dashboard` (`frontEnd/dist`).
- `yarn desktop-dev` — Electron + Vite dev.
- Lint: `yarn workspace front-end lint`, `yarn workspace livemock-desktop lint` (only these two workspaces have `lint` scripts).
- Tests: `yarn workspace livemock test` (Jest, tests under `backEnd/test/`). Single suite/file: `yarn workspace livemock test test/matcher` etc. This is the only workspace with tests.

## Things an agent would get wrong

- **`livemock-core` must be built before anything consuming it runs.** Its exports map `require` → `./build/struct/*.js`, so the back-end (CommonJS/ts-node) and desktop use the compiled output, not source. `web-build`, `web-start` deps, and `desktop-dev` all build `core` first; if you edit `core/struct/`, run `yarn workspace livemock-core build` yourself. Import from subpaths like `livemock-core/struct/project`, never from `core/index.ts` (empty stub).
- **The web API lives under `/api`.** `ServerUrl` in `frontEnd/src/config.ts` is the origin-relative API base (`/api`); REST paths and the Socket.IO path (`/api/socket.io`) are built from it, and the backend mounts all API routers on an `/api` parent router. In dev Vite proxies `/api` to `LIVEMOCK_PORT`, in prod the backend serves the UI at `/dashboard` same-origin. Never hardcode an absolute `http://localhost:9002` URL.
- **Code is duplicated across flavors.** Web server logic (`backEnd/src/`) and Electron main logic (`desktop/electron/`) are near-copies; the UI (`frontEnd/src/` vs `desktop/src/`) likewise. Web talks to the server via superagent + socket.io (`frontEnd/src/server/`), desktop via `window.api` IPC (preload/handlers). Fix logic changes in the matching places in all four trees.
- `desktop/` is only a UI shell; `desktop/electron/` compiles separately with `tsc -project electron` into `dist-electron/`, while the renderer is plain Vite. Don't put web-only code that talks HTTP in `desktop/src/`.
- Each project runs its own mock listener on a per-project port (default `"8088"`, `core/struct/project.ts`), started/stopped via project routes.
- `noImplicitAny` is disabled everywhere and all workspace tsconfigs are permissive; don't tighten types when adding code.

## Style/version quirks

- Backend/desktop pin `express 4.18.x` and old toolchains (ts-jest 28, TS 4.6 in `core/`, prettier 2.8 in backend vs 3.x at root). Keep dependency bumps scoped to the workspace that needs them.
- DB files under `backEnd/db/` are gitignored runtime data.
