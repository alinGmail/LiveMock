# 01: Filter slice and editor foundation

**What to build:** Add the renderer-side foundation for custom filters: a narrowed slice
type with add/modify/remove reducers, a hydrated simple-filter type predicate that keeps
the page compiling, and the ported filter editor component and styles.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] `logFilter` is typed as `SimpleFilterM[]` and `resetLogFilter` accepts that type.
- [x] Add, modify and remove filter reducers exist and are exported.
- [x] Log-view hydration narrows simple filters with a type predicate.
- [x] The desktop has a filter editor component and CSS module matching the web editor's
      fields, IN tag input, active toggle, footer and popover positioning.
- [x] No IPC, preload, handler, backend or core file changes are needed.
- [x] Desktop lint and renderer typecheck pass.
