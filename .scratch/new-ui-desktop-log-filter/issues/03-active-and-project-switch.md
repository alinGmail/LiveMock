# 03: Active semantics and project switching

**What to build:** Desktop treats a missing `activate` as active, matching the backend.
The empty state counts simple filters correctly, and switching projects clears the old
project's custom filters and closes any open editor before the new log view loads.

**Blocked by:** 02 (needs the filter UI and editor state)

**Status:** done

- [x] `hasActiveFilters` treats `activate !== false` as active.
- [x] Inactive filters do not count as active for the empty-state copy.
- [x] Switching projects clears custom filters immediately.
- [x] Switching projects closes the filter editor.
- [x] The new project's persisted filters load from its log view.
- [x] Desktop lint and renderer typecheck pass.
