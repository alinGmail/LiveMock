# 01: Backend active-filter semantics and persistence

**What to build:** Make `activate` real for simple log filters and make newly added filters
survive a restart. This is the backend half of the custom-filter feature and is shared by
both flavours.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A simple filter with `activate: false` is not applied to the dynamic view on reload
      or when added.
- [ ] Activating an existing filter applies it; deactivating it removes it from the
      dynamic view.
- [ ] Deleting a filter that is not in the dynamic-view pipeline does not throw.
- [ ] Adding a simple filter (and the first-time preset append) marks the log-view
      collection dirty so Loki autosave persists it.
- [ ] The same dynamic-view reconciliation/removal semantics are mirrored in the desktop
      main-process copy.
- [ ] Backend tests cover active/inactive add/update/delete through the controller and the
      list result, following the existing log-filter/log controller suites.
