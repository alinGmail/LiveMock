# 05: End-to-end manual verification

**What to build:** Verify the finished desktop Request Log as a real Electron user would
use it, covering filters, live updates, pagination, inline detail and the mock dialog.

**Blocked by:** 04: Remove legacy Request Log UI.

**Status:** ready-for-agent

- [ ] Launch the desktop app and confirm the Request Log renders the new master–detail
      workspace inside the new shell.
- [ ] Verify expectation/method/status filters, filter persistence, Pause/Resume, Clear
      and Columns toggles.
- [ ] Verify the stream’s newest-first order, 50-row load-more, pending rows, selected
      state, live flash, insertion edge case and empty states.
- [ ] Verify live insert/update/delete while the mock listener runs, pause dropping
      events, resume refetch and websocket updates on the selected request.
- [ ] Verify the detail pane’s default selection, row switching, Overview/Request/
      Response/Websocket tabs, JSON tinting, pending response and behaviour when the
      selected log is filtered out or pruned.
- [ ] Verify the mock dialog’s prefill, matcher toggles, response editing, invalid-JSON
      feedback, save, toast, description and expectation-list refresh.
- [ ] Verify project switching clears selection/filters correctly and the detached detail
      window is gone.
- [ ] Confirm no console errors and run lint, renderer type-check, Electron type-check,
      renderer build and the existing backend tests.
