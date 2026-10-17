# 02: Request Log master stream and inline detail

**What to build:** The Request Log page becomes a single-page master/detail workspace — a newest-first request stream on the left and an inline detail pane on the right — replacing the antd table and the separate detail route.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] The page shows a master stream (left) and an inline detail pane (right); selecting a row shows its detail without navigating.
- [ ] Stream rows are newest-first and driven by the existing socket insert/update/delete handlers.
- [ ] Each row shows a status-coloured rail, method badge, path, matched expectation, proxy/static/ws marker, time, duration and status pill; a pending state when there is no response; a selected state.
- [ ] A newly inserted row gets a brief highlight.
- [ ] Empty states distinguish "no requests captured" from "no matching requests".
- [ ] The detail pane header shows method + path and a disabled (inert) "Mock this request" button; there is no copy or delete button.
- [ ] The detail pane has Overview / Request / Response / Websocket tabs (Websocket only for websocket logs): Overview = summary grid + matched expectation + proxy card; Request/Response = status line, header (and query) tables, pretty JSON body with syntax highlighting; Websocket = client/server message bubbles.
- [ ] The default selected row is the newest request.
- [ ] Columns popover toggles the per-row expectation / duration / marker fields (default on).
- [ ] The old separate detail route (`requestLog/detail/:logId`) and its page/cards are removed.
- [ ] Web only; the socket events and `LogM` model are unchanged.
