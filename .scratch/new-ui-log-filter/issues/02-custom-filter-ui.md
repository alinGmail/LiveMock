# 02: Web custom-filter chips and editor

**What to build:** Implement the redesigned custom-filter UI on the web Request Log:
chips, `+ Add filter`, the anchored add/edit popover, validation, IN tags, active styling,
and persistence through the existing log-filter endpoints.

**Blocked by:** 01: Backend active-filter semantics and persistence.

**Status:** ready-for-agent

- [ ] The filter bar shows persisted simple filters as chips after the status-family chips,
      followed by a dashed `+ Add filter` control.
- [ ] Active chips show `property $condition value`; inactive chips use the dashed border,
      hollow ring and struck-through value from the design.
- [ ] A chip opens an edit popover; `+ Add filter` opens the same popover in create mode
      with `req.path` / `CONTAINS` / empty value / Active defaults.
- [ ] The popover has Property with common-path suggestions, a six-condition select
      (excluding FAMILY), a single value input or IN tags input, an Active toggle, and
      Delete / Cancel / Done.
- [ ] Add is draft-first and only persists on confirm; Cancel, Escape and outside click
      discard the draft.
- [ ] Property, normal value and IN tags are validated before saving; the primary action
      is disabled while invalid or saving.
- [ ] Create/update/delete call the existing add/update/delete wrappers, update the Redux
      filter list and refetch the request list.
- [ ] The chip `x` removes the filter without opening the editor, with correct event
      propagation.
- [ ] Chips and Add are keyboard reachable; the editor focuses its first field, closes on
      Escape, and restores focus to the originating control.
- [ ] Filter state is reloaded from the log-view response after a project switch/reload.
- [ ] Failed saves/deletes show a toast instead of silently changing the list.
