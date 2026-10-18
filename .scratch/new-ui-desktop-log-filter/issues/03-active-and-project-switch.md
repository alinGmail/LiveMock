# 03: Active semantics and project switching

**What to build:** Desktop treats a missing `activate` as active, matching the backend.
The empty state counts simple filters correctly, and switching projects clears the old
project's custom filters and closes any open editor before the new log view loads.

**Blocked by:** 02 (needs the filter UI and editor state)

**Status:** ready-for-agent

- [ ] `hasActiveFilters` treats `activate !== false` as active.
- [ ] Inactive filters do not count as active for the empty-state copy.
- [ ] Switching projects clears custom filters immediately.
- [ ] Switching projects closes the filter editor.
- [ ] The new project's persisted filters load from its log view.
- [ ] Desktop lint and renderer typecheck pass.
