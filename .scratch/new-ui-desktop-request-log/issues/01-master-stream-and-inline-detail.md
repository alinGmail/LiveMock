# 01: Request stream and inline detail

**What to build:** Replace the old Request Log table and detached detail window with the
redesign’s master–detail workspace. A desktop user should see a live, newest-first request
stream on the left and an inline detail pane on the right, with Overview / Request /
Response / Websocket tabs. The page must use the existing desktop IPC data layer for
initial loading and live updates.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] The Request Log route renders the two-pane layout instead of the antd table, with
      the newest request selected by default and the selected row highlighted.
- [ ] The stream shows status rail, method, path, matched expectation, proxy/websocket
      markers, time, duration and status pill; pending rows are visible when there is no
      response.
- [ ] The initial fetch asks for 50 rows, scrolling near the bottom loads 50 more with
      `maxLogId`, and duplicate ids are not inserted.
- [ ] Live insert/update/delete events from the existing IPC channels update the list in
      descending id order; events for another log view are ignored; the insertion edge
      case where a new id is older than the whole list is handled.
- [ ] The selected request receives live updates from the existing project log-update
      channel; switching projects and clearing logs resets the selection.
- [ ] The inline detail pane shows the header, summary chips, matched expectation, proxy
      information, request headers/query/body, response headers/body and websocket
      messages; JSON bodies are pretty-printed and tinted.
- [ ] A newly inserted or updated row flashes briefly; empty states distinguish “no
      requests” from “no matching requests”.
- [ ] The page stacks master and detail below the existing responsive breakpoint.
