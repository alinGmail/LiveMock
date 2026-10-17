# New UI — Desktop Request Log Page

**Status:** ready-for-agent

> Source of truth: the already-shipped web Request Log redesign (`frontEnd/src`) and the
> static design reference under `new-ui/` (`DESIGN.md`, `design-notes.md`, `index.html`).
> Branch / worktree: `desktop-new-ui` in `feature-new-ui-desktop`.

## Problem Statement

The desktop app’s shell and Expectation page now use the new dark redesign, but the
Request Log page is still the old UI: stacked antd filter rows, a flat table with a
configurable column model, and request detail in a separate 800×500 BrowserWindow. The
web dashboard has already moved to the redesign’s single-page master–detail workspace: a
compact filter bar, a live request stream, and an inline detail pane with Overview,
Request, Response and Websocket tabs.

Desktop users therefore get a different Request Log experience from web users. They
cannot inspect a request inline, cannot pause the live stream, do not get pending rows or
new-row highlights, and only see the first 100 requests with no load-more. The desktop
data layer is not the gap: its IPC handlers already support log-view pagination with
`maxLogId` and `limit`, log filters, clear-all, and live insert/update/delete events. The
gap is the renderer, which still uses the old table and detached detail window.

The desktop Log page also has capabilities the web redesign does not: custom simple
filter editing, arbitrary JSON-path table columns, a full column editor, an OPTIONS method
filter, exact status-code filtering, a websocket chat modal, and a detached detail window.
Replacing the page with the web design therefore requires explicit product decisions about
which of those capabilities are dropped.

## Solution

Port the web Request Log redesign to the Electron desktop renderer.

- **Filter bar**: expectation dropdown, GET/POST/PUT/DELETE method chips, 2xx–5xx status
  family chips, a live/paused indicator, Pause/Resume, Clear with confirmation, and a
  Columns popover for expectation / duration / marker.
- **Request stream**: newest-first rows with status rail, method, path, matched
  expectation, proxy/websocket markers, time, duration and status pill. Fifty rows per
  page, loaded on scroll with `maxLogId`; pending rows for requests without a response;
  selected-row styling; a short green flash on newly inserted/updated rows; explicit
  empty states for “no requests” and “no matching requests”.
- **Live updates**: replace socket.io with the existing Electron IPC event channels,
  scoped to the current log view. Pause freezes list updates; Resume refetches to catch up.
- **Inline detail**: a right-hand pane with method/path header, summary chips, Mock this
  request action, and Overview / Request / Response / Websocket tabs. Selection defaults
  to the newest request and follows row clicks. The separate detail BrowserWindow and its
  route are removed.
- **Mock this request**: replace the old antd dialog with the redesigned web dialog —
  dark modal shell, matcher selection, response editor, Monaco body, Reset/Cancel/Save,
  invalid-JSON feedback, and an automatic `Mocked from request METHOD PATH` description.
  Saving closes the dialog, shows a toast, refetches the expectation list and stays on the
  Request Log.
- **Cleanup**: remove the old table, column components, old filter editor components,
  websocket chat modal, detached detail page and their unused state once the new page is
  live.

This is strict web parity. The following existing desktop capabilities are deliberately
removed in this step: custom filter editing, the full column editor and custom JSON-path
columns, the detached detail window, the websocket chat modal, OPTIONS filtering, exact
status-code filtering, and raw-log/root columns. Copy-as-cURL and per-log delete remain
absent because neither flavour has an endpoint for them.

## User Stories

1. As a desktop user, I want the Request Log page to use the same dark master–detail
   design as the web dashboard, so that the product feels consistent.
2. As a desktop user, I want a compact filter bar, so that I can narrow the request
   stream without leaving the page.
3. As a desktop user, I want to filter by expectation, so that I can see the requests a
   specific mock matched.
4. As a desktop user, I want GET/POST/PUT/DELETE method chips, so that I can focus on one
   HTTP method.
5. As a desktop user, I want 2xx/3xx/4xx/5xx status-family chips, so that I can scan
   errors quickly.
6. As a desktop user, I want filters to persist in the log view, so that my choices
   survive reloads.
7. As a desktop user, I want a live/paused indicator, so that I know whether the stream
   is updating.
8. As a desktop user, I want to pause the stream, so that I can inspect a request without
   rows moving under me.
9. As a desktop user, I want Resume to refresh the list, so that I catch up on traffic
   that arrived while paused.
10. As a desktop user, I want a Clear action with confirmation, so that I can wipe the
    request log safely.
11. As a desktop user, I want a Columns popover for expectation, duration and markers,
    so that I can choose what each row shows.
12. As a desktop user, I want a newest-first request stream, so that recent traffic is at
    the top.
13. As a desktop user, I want each row to show method, path, matched expectation, marker,
    time, duration and status, so that I can scan quickly.
14. As a desktop user, I want a coloured status rail and status pill, so that successes
    and errors stand out.
15. As a desktop user, I want a pending row while a request has no response, so that
    in-flight requests are visible.
16. As a desktop user, I want newly arrived or updated rows to flash briefly, so that I
    notice live traffic.
17. As a desktop user, I want the list to load 50 more rows when I scroll near the
    bottom, so that I can review history without a page reload.
18. As a desktop user, I want a “loading more” footer, so that I know more rows are on the
    way.
19. As a desktop user, I want distinct empty states for “no requests” and “no matching
    requests”, so that I understand why the list is empty.
20. As a desktop user, I want to click a row and see its detail inline, so that I do not
    lose the list.
21. As a desktop user, I want the newest request selected by default, so that the detail
    pane is populated on load.
22. As a desktop user, I want the selected row highlighted, so that I know which request
    the detail describes.
23. As a desktop user, I want the detail header to show method, path and summary chips,
    so that I can read the request at a glance.
24. As a desktop user, I want an Overview tab with the matched expectation, action brief,
    proxy target and proxy headers, so that I can understand how the request was handled.
25. As a desktop user, I want a Request tab with headers, query and body, so that I can
    inspect the incoming request.
26. As a desktop user, I want a Response tab with status, headers and a pretty-printed
    JSON body, so that I can inspect the mock response.
27. As a desktop user, I want a pending response panel, so that an unfinished request does
    not look broken.
28. As a desktop user, I want a Websocket tab for websocket logs, so that I can read the
    client/server conversation inline.
29. As a desktop user, I want JSON bodies syntax-tinted, so that large payloads are
    easier to read.
30. As a desktop user, I want to open the redesigned Mock this request dialog from the
    detail header, so that I can create an expectation from captured traffic.
31. As a desktop user, I want the mock dialog pre-filled from the captured request, so
    that I do not have to retype method, path, query or headers.
32. As a desktop user, I want to choose which matchers are enabled, so that only the
    fields I care about are matched.
33. As a desktop user, I want to edit the response status, headers and JSON body, so that
    the new expectation returns what I need.
34. As a desktop user, I want invalid JSON to be flagged before saving, so that I do not
    create a broken mock.
35. As a desktop user, I want the new expectation to get a description derived from the
    captured request, so that it is identifiable on the Expectation page.
36. As a desktop user, I want to stay on the Request Log after saving, so that I can keep
    inspecting traffic.
37. As a desktop user, I want a toast after saving, so that I know the expectation was
    created.
38. As a desktop user, I want the expectation dropdown to refresh after saving, so that
    the new mock is immediately filterable.
39. As a desktop user, I want live updates to work through the desktop IPC layer, so that
    the page works without an HTTP server.
40. As a desktop user, I want live events scoped to the current log view, so that events
    from another view do not corrupt the list.
41. As a desktop user, I want websocket updates for the selected request, so that its
    detail stays current.
42. As a desktop user, I want clearing logs to clear the selection, so that the detail
    pane does not show a deleted request.
43. As a desktop user, I want switching projects to reset selection and filters, so that
    I do not see the previous project’s request.
44. As a desktop user switching projects, I want the new project’s log view and
    expectations loaded, so that the page is correct immediately.
45. As a desktop user, I want the page to stack master and detail below the responsive
    breakpoint, so that it stays usable on a narrow window.
46. As a keyboard user, I want visible focus and standard buttons/inputs, so that I can
    use the page without a mouse.
47. As a desktop user, I want the new page to keep working when the selected log is
    filtered out or pruned, so that the detail does not crash.
48. As a desktop user, I want existing log data and filters to keep working, so that
    upgrading requires no migration.
49. As a desktop user, I want the old table and detached detail window gone, so that I am
    not exposed to two competing Request Log experiences.
50. As a developer, I want the desktop data layer preserved, so that the removed column and
    custom-filter features could be reintroduced later if product decides to.
51. As a developer, I want the web and desktop renderers to stay near-copies, so that
    future Request Log design changes can be ported predictably.
52. As a maintainer, I want lint, type-check and build to pass, so that the port does not
    introduce compile-time drift.
53. As a maintainer, I want a manual Electron checklist for live updates, pagination,
    filtering, detail tabs and the mock dialog, so that the port is verified end to end.

## Implementation Decisions

### Scope

- This step replaces the **desktop Request Log page only**. The new shell, Expectation
  page, Config page, first-run welcome page and the rest of the desktop UI are unchanged.
- The web Request Log implementation is the source of truth for layout, interactions and
  state transitions. The static design demo is the reference for visual tokens and any
  behaviour the web implementation has not ported.
- The desktop renderer remains a near-copy of the web renderer, adapted to IPC.

### Page structure

- The page is a full-height flex column: a filter bar across the top, then a two-column
  workspace. The master is a scrollable request stream; the detail is an independently
  scrollable inline pane. Below the existing responsive breakpoint the workspace stacks.
- The selected request is renderer state, not a route parameter. The detail is rendered
  from the selected log already present in the list, falling back to the selected log item
  captured from live updates.
- The default selection is the newest loaded request. Clicking a row selects it. Clearing
  logs or changing projects clears both the selected id and the selected item.

### Filter bar

- Filters map onto the existing server-persisted log-view filters:
  - expectation dropdown → the expectation preset filter;
  - method chips → the methods preset filter;
  - status-family chips → the status-code preset filter using family tokens.
- Each filter change persists through the existing log-filter IPC wrapper and refetches
  the request list.
- The method set is GET, POST, PUT and DELETE. Status families are 2xx, 3xx, 4xx and 5xx.
  OPTIONS and exact status codes are not exposed in this step.
- Clear calls the existing delete-all IPC wrapper and refetches the list.
- The Columns popover toggles three row fields locally: expectation, duration and
  proxy/websocket marker. It is not persisted and does not expose custom columns.
- The live/paused indicator reflects the page’s client-side pause state. Pause stops
  applying live list events; Resume refetches the first page.

### Request stream and pagination

- The list is newest-first by descending id.
- The initial fetch requests 50 rows. Loading more uses the last loaded id as `maxLogId`,
  requests 50 more, and merges by id without duplicates. `hasMore` is true while a page
  returns a full 50 rows.
- Live inserts are placed in descending id order, including the case where the new id is
  older than every loaded row. Updates replace in place. Deletes remove by id.
- A new or updated row flashes green briefly. Pending rows (`res == null`) show a pending
  status and a dashed rail.
- Empty states distinguish an empty log from a filter that excludes everything.

### Live updates

- Socket.IO is not used in the desktop renderer. The page subscribes through the existing
  `window.api.event` API:
  - log-view add/update/delete channels for list changes;
  - the project log-update channel for updates to the selected request.
- List events are ignored unless their `logViewId` matches the current view. The selected
  log update is applied only when its project matches and its id is the selected id.
- Pause gates the list event handlers. Events are dropped rather than buffered; Resume
  refetches.
- Expectation live push is not added in this step. The page keeps the existing expectation
  query and refetches it after a mock is saved; the web page’s expectation socket branches
  are not ported.

### Inline detail

- The header shows method, path, a Mock this request action, and summary chips for status,
  duration, time and matched expectation.
- Overview shows a summary grid, matched expectation and action brief, proxy target and
  proxy request/response headers.
- Request shows headers, query (when present) and body. Response shows status, headers and
  body, or a pending panel when there is no response. Websocket shows client/server
  message bubbles with direction and time.
- JSON bodies are pretty-printed and syntax-tinted. Header/query values use the redesign’s
  key/value grid.
- The detail pane shows an explicit “select a request” state only when nothing is
  selected.

### Mock this request

- The redesigned dialog is ported from web: custom modal shell, name, matcher rows
  (method/path/query/param), response status, response headers and a dark Monaco body.
- The shared core draft/expectation conversion stays authoritative. Default checked
  matchers and conversion defaults are not changed.
- Before creating, the expectation description is set to
  `Mocked from request METHOD PATH`.
- Invalid JSON blocks saving and shows an inline error.
- Saving closes the dialog, shows a toast, calls the existing expectation-created callback
  and refetches the expectation list. It does not navigate to the Expectation page.

### Cleanup and data layer

- Reuse the existing desktop log and log-filter server wrappers, IPC handlers, Redux slice
  fields for filters/selection, and shared core types. No backend, core or IPC contract
  change is required.
- Adapt the imported web page to the desktop names (`listExpectationListReq`) and remove
  all socket.io/HTTP imports.
- After the new page works, remove the old request-log table page/column components, old
  filter row/editor components, expectation brief, log utils only used by those, websocket
  chat modal, detached detail page/cards, the detached detail route, and unused
  column/chat state. Keep the server wrappers, IPC handlers, slice filter/selection state
  and get-detail handler.
- The detached window action and route are removed; no other feature uses them.

## Testing Decisions

- A good test exercises externally observable behaviour through the highest existing
  seam and asserts outcomes, never internal structures or call counts.
- There is no automated renderer test harness. This step does not add one. The highest
  practical seam is the running Electron app.
- Static verification: desktop lint, renderer TypeScript, Electron TypeScript and a
  production renderer build. These catch broken imports, missing modules and mismatched
  IPC wrapper signatures.
- Backend/core suites are the regression guard for the shared log model and filter
  translation. No backend or core behaviour is changed, so the existing Jest suite must
  continue to pass.
- Manual verification covers:
  - filter bar: expectation, method chips, status families, persistence, pause/resume,
    clear, columns toggles;
  - stream: newest-first, 50-row load-more, pending rows, selected state, live flash,
    empty states, insertion edge case;
  - live IPC: insert/update/delete while running, pause dropping events, resume refetch,
    websocket updates on the selected request;
  - detail: default selection, row switching, Overview/Request/Response/Websocket tabs,
    JSON tinting, pending response, filtering/pruning the selected row;
  - mock dialog: prefill, matcher toggles, response editing, invalid JSON, save, toast,
    expectation refetch, description;
  - compatibility: project switch, clear selection, old logs, no detached window, no
    console errors.

## Out of Scope

- Custom filter chips / Add filter / the filter editor popover.
- The full column editor, custom JSON-path columns, TEXT/JSON column display and
  raw-log/root columns.
- The detached request-log detail BrowserWindow and its route.
- The websocket chat modal.
- OPTIONS method filtering and exact status-code filtering.
- Copy as cURL and single-log delete.
- Expectation live push events for inserts/updates/deletes.
- Navigation to the Expectation page after saving a mock, or cross-page selection.
- Redesigning Config, Welcome, Auth or the Expectation page.
- Light theme.
- Shared UI package extraction.
- Any backend, core model, IPC channel or database change.
- Automated renderer/end-to-end tests.

## Further Notes

- Strict web parity is a conscious product decision. The desktop loses custom filters,
  column configuration and the detached detail window in this step; they are recorded here
  so a later step can restore them intentionally if needed.
- The detached detail window was already limited: it had no live updates, no inline tabs,
  and a project-unscoped query key. Removing it does not lose data that the inline pane
  cannot show.
- The old desktop list fetched at most 100 logs and had a silent insertion edge case; the
  new page fixes both through pagination and the append path.
- Live events are only forwarded to the main window. The inline detail lives in that
  window, so this limitation does not affect the new page.
- Work happens on the `desktop-new-ui` branch in the `feature-new-ui-desktop` worktree.
- Tracker convention: this spec lives at
  `.scratch/new-ui-desktop-request-log/spec.md`; implementation tickets go to
  `.scratch/new-ui-desktop-request-log/issues/NN-<slug>.md`.
