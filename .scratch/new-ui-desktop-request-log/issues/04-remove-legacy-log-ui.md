# 04: Remove legacy Request Log UI

**What to build:** Delete the old Request Log table, column editor/config, old filter
components, websocket chat modal and detached detail page/route once the new master–detail
page is live. Keep the data layer so removed capabilities could be restored later.

**Blocked by:** 03: Mock this request dialog.

**Status:** ready-for-agent

- [ ] The old LogPageColumn, column config/editor/text column, old preset/simple filter
      components, expectation brief, log utils, chat modal and detached detail page/cards
      are removed from the renderer.
- [ ] The detached `/requestLog/detail/:logId` route and its open-new-window action are
      removed.
- [ ] Unused column/chat state and actions in the log slice are removed where nothing
      references them.
- [ ] Desktop log/log-filter server wrappers, IPC handlers, filter/selection slice state
      and get-detail handler remain.
- [ ] The new Request Log page still builds, lints and type-checks with no broken imports.
- [ ] No other page imports a deleted component.
