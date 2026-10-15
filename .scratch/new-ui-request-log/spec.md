# Request Log page redesign (new UI — step 5)

**Status:** ready-for-agent

> Source of truth: the Request Log page in `new-ui/index.html` (filter bar ~426–450, script
> ~843–1123) and `new-ui/design-notes.md` (Request Log section). Branch: `new-ui-expectation`.

## Problem Statement

The Request Log page still uses the old full-page antd table, with request detail in a separate browser tab. It doesn't match the redesign, which turns it into a single-page master/detail workspace with a compact filter bar, a live request stream, and an inline detail with Overview/Request/Response/Websocket tabs.

## Solution

Replace the Request Log page with the redesigned single-page master/detail UI:

- A compact **filter bar**: expectation dropdown, method chips, status-family chips (2xx/3xx/4xx/5xx), a Live indicator, Pause/Resume, Clear, and a Columns popover (expectation / duration / marker). Filtering stays **server-side** (persisted in the log view) with a refetch per change.
- A **master stream** of newest-first rows (status rail, method, path, matched expectation, proxy/static/ws marker, time, duration, status pill; pending, selected and just-in-highlight states; empty states).
- An **inline detail pane** with a header, summary chips, and Overview / Request / Response / Websocket tabs — replacing the separate detail route and its cards.
- The list is driven by the existing socket.io insert/update/delete events; Pause freezes updates and Resume refetches.

The web dashboard only. The socket events and `LogM` model are unchanged.

## User Stories

1. As a mock author, I want a compact filter bar, so that I can narrow the request stream without leaving the page.
2. As a mock author, I want to filter by expectation, so that I can see the requests a specific mock matched.
3. As a mock author, I want method chips, so that I can focus on one HTTP method.
4. As a mock author, I want status-family chips (2xx/3xx/4xx/5xx), so that I can scan errors quickly.
5. As a mock author, I want a live indicator and Pause/Resume, so that I can freeze the stream while I inspect a row.
6. As a mock author, I want Resume to refresh the list, so that I catch up on what happened while paused.
7. As a mock author, I want a Clear action with confirmation, so that I can wipe the log.
8. As a mock author, I want a Columns popover (expectation / duration / marker), so that I can choose what each row shows.
9. As a mock author, I want a newest-first stream of request rows, so that I see recent traffic first.
10. As a mock author, I want each row to show method, path, matched expectation, markers, time, duration and status, so that I can scan quickly.
11. As a mock author, I want a coloured status rail and pill, so that success and errors stand out.
12. As a mock author, I want a pending row for requests with no response yet, so that in-flight requests are visible.
13. As a mock author, I want newly arrived rows briefly highlighted, so that I notice live traffic.
14. As a mock author, I want clear empty states for "no requests" and "no matching requests", so that I understand why the list is empty.
15. As a mock author, I want to click a row to see its detail inline, so that I don't lose the list.
16. As a mock author, I want a detail header with method and path and summary chips, so that I can read the request at a glance.
17. As a mock author, I want an Overview tab, so that I can see method/path/status/duration/time/matched and any proxy details.
18. As a mock author, I want a Request tab with headers, query and body, so that I can inspect the incoming request.
19. As a mock author, I want a Response tab with status, headers and pretty-printed JSON, so that I can inspect the mock response.
20. As a mock author, I want a Websocket tab (only for websocket logs) showing client/server message bubbles, so that I can read the conversation.
21. As a mock author, I want the selected row clearly highlighted, so that I know which detail is shown.
22. As a mock author, I want the list to update live as requests arrive, so that I can watch traffic.
23. As a mock author, I want the page to keep the existing server-side filtering, so that my filter choices persist across reloads.

## Implementation Decisions

### Backend: status-family filtering

- The log-view filter is applied server-side and maps `IN` to Loki `$in`, which cannot express ranges. Extend the shared filter translation so an `IN` value may contain **family tokens** (`1xx`–`5xx`): family tokens expand to an inclusive range (`$gte`/`$lte`) and are combined with the exact `$in` values via `$or`. The value stays a `string[]`.
- The same change is mirrored in the desktop main-process copy of the filter translation (per the repo's four-tree rule).
- Backend tests cover the family expansion.

### Filter bar

- Maps onto the existing server-persisted log-view filters and refetches after each change:
  - expectation dropdown → the `EXPECTATION` preset filter
  - method chips → the `METHODS` preset filter
  - status-family chips (2xx/3xx/4xx/5xx) → the `STATUS_CODE` preset filter (family tokens)
- **Custom filter chips and Add filter are not implemented in this step** (omitted from the bar).
- Live indicator reflects the socket connection. Pause stops applying incoming socket insert/update events; Resume triggers a refetch to catch up. Clear uses the existing delete-all with confirmation.
- Columns popover toggles the per-row `expectation` / `duration` / `marker` fields (client state, default all on).

### Master stream

- Newest-first (descending id), driven by the existing socket insert/update/delete handlers (keep the current local log state). Newly inserted rows get a brief highlight.
- Row: status-coloured rail, method badge, path, matched expectation (when enabled), proxy/static/ws marker (when enabled), time, duration (when enabled), status pill; pending state when there is no response; selected state.
- Empty states: "no requests captured" vs "no matching requests" (when filters exclude everything).

### Inline detail

- Rendered in a right-hand pane; selecting a row shows it without navigating. The default selected row is the newest.
- Tabs Overview / Request / Response / Websocket (the last only for websocket logs). Overview: summary grid, matched expectation (reuse the expectation brief), and a proxy card with its headers. Request/Response: status line, header (and query) tables, pretty-printed JSON body with syntax highlighting. Websocket: client/server message bubbles.
- The detail header shows method + path and an inert (disabled) **Mock this request** button; there is **no copy or delete** button. The old separate detail route and its card components are removed.

### Scope and cleanup

- Web only; no change to the shared core model, the socket events, or `LogM`.
- Remove the old request-log detail route and page/cards, and the old filter/column components that the new page replaces.

## Testing Decisions

- A good test exercises externally observable behaviour through the highest existing seam.
- **Backend**: extend the log filter tests with status-family expansion (exact + family, family-only, mixed).
- **Frontend**: no automated tests (no harness); manual verification via the Chrome DevTools MCP covers the filter bar, stream states, inline detail tabs, pause/resume/clear, and live updates.

## Out of Scope

- Custom filter chips / Add filter and the filter editor popover.
- Mock this request — the button was rendered inert in this step; it is now implemented in `.scratch/new-ui-mock-from-log/spec.md` (step 6).
- Copy-as-cURL and per-log delete (no endpoint).
- The full column editor dialog.
- Light theme and the desktop flavor's UI (its filter translation is mirrored for parity only).

## Further Notes

- Filter translation lives in `backEnd/src/log/logUtils.ts` and `desktop/electron/log/logUtils.ts`.
- Tracker convention: this spec lives at `.scratch/new-ui-request-log/spec.md`; implementation tickets go to `.scratch/new-ui-request-log/issues/NN-<slug>.md`.
