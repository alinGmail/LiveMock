# 03: Active semantics and project switching

**What to build:** Desktop treats a missing `activate` as active, matching the backend.
The empty state counts simple filters correctly, and switching projects clears the old
project's custom filters and closes any open editor before the new log view loads.

**Blocked by:** 02 (needs the filter UI and editor state)

**Status:** done

- [x] `hasActiveFilters` treats `activate !== false` as active.
- [x] Inactive filters do not count as active for the empty-state copy.
- [x] Switching projects clears custom filters.
- [x] Switching projects closes the filter editor.
- [x] An in-flight save or delete that completes after a switch is ignored, so it cannot
      mutate or refetch the new project's list.
- [x] The new project's persisted filters load from its log view.
- [x] Desktop lint and renderer typecheck pass.
