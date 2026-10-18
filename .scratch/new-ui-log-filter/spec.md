# New UI — Request Log Custom Filters

**Status:** ready-for-agent

> Source of truth: the Request Log custom-filter design in `new-ui/index.html` and
> `new-ui/design-notes.md`, plus the existing log-filter data layer.
> Branch / worktree: `feature-new-ui-filter` in `feature-new-ui-filter`.

## Problem Statement

The redesigned Request Log has a compact filter bar for the expectation, HTTP method and
status family, but it never implemented the custom-filter half of the design. Users can
only filter by the three presets; they cannot add a filter on an arbitrary log field,
edit it, disable it, or remove it. The old pre-redesign UI could add simple filters, but
the redesign deliberately omitted that UI while keeping the server-side filter pipeline
and the persisted `SimpleFilterM` records.

The data layer is already there: the web log-view response carries simple filters, the
log-filter REST wrappers exist, the backend applies them to the Loki dynamic view, and the
Redux slice still hydrates them. What is missing is the redesigned custom-filter UI and the
state wiring to create, update and delete those filters.

Two backend defects also prevent the design from working honestly:

- `activate` is stored on every filter but ignored by the dynamic-view pipeline, so an
  inactive filter still filters the list.
- Adding a simple filter pushes it into `logView.filters` without marking the Loki
  collection dirty, so the new filter may not survive a restart.

## Solution

Implement the complete custom-filter UI from the redesign on the **web** Request Log:

- Custom chips in the filter bar, after the status-family chips. Each chip shows
  `property $condition value`; inactive filters use a dashed border, a hollow ring and a
  struck-through value.
- A dashed `+ Add filter` control opens the same editor popover in create mode.
- Clicking a chip opens the editor in edit mode. The popover has Property (with a
  datalist of common log paths), Condition, Value, Active, and Delete / Cancel / Done.
- Create is draft-first: nothing is persisted until the user confirms. Cancel, Escape and
  outside clicks discard the draft.
- IN filters use a tags input (multiple values) and store `string[]`; other conditions use
  a single text value.
- Custom filters are persisted through the existing log-filter REST endpoints and the
  request list is refetched after every create/update/delete.
- Active is implemented end-to-end: the backend skips inactive filters when building the
  dynamic view, and applies/removes them when a filter is toggled. The same change is
  mirrored in the desktop main-process copy per the repo's four-tree rule.
- Adding a simple filter marks the log-view collection dirty so it is autosaved.

Only `SIMPLE_FILTER` is supported. Group filters, nested groups and the internal `FAMILY`
condition stay out of the custom-filter editor.

## User Stories

1. As a web user, I want an `+ Add filter` control in the Request Log filter bar, so that
   I can filter by a field other than the presets.
2. As a web user, I want the Add filter control to open an editor popover, so that I can
   define the filter without leaving the page.
3. As a web user, I want the Add editor to default to a sensible property and condition,
   so that I can add a common path filter quickly.
4. As a web user, I want to type any JSON path in the Property field, so that I can filter
   on request or response fields the presets do not cover.
5. As a web user, I want common log paths suggested as I type, so that I do not have to
   remember the exact path.
6. As a web user, I want to choose a condition from EQUAL / NOT_EQUAL / CONTAINS /
   GREATER / LESS / IN, so that I can express the comparison I need.
7. As a web user, I want condition names shown with their symbols (`$eq`, `$neq`,
   `$contains`, `$gt`, `$less`, `$in`), so that I can map them to the underlying query.
8. As a web user, I want to enter a single value for normal conditions, so that simple
   comparisons are quick.
9. As a web user, I want to enter multiple tags for IN, so that I can match any of several
   values without comma-escaping problems.
10. As a web user, I want an Active switch in the editor, so that I can save a filter
    without applying it yet.
11. As a web user, I want Add filter to only persist when I confirm, so that cancelling
    does not leave an empty filter behind.
12. As a web user, I want Cancel, Escape and clicking outside to discard my draft, so that
    accidental edits do not change the list.
13. As a web user, I want to click a custom chip to edit it, so that I can change its
    property, condition, value or active state.
14. As a web user, I want to delete a filter from the editor, so that I can remove it.
15. As a web user, I want an `x` on each custom chip, so that I can remove it without
    opening the editor.
16. As a web user, I want inactive filters to look dashed, hollow and struck through, so
    that I can distinguish them from active filters without losing their configuration.
17. As a web user, I want inactive filters to stop filtering the list, so that the visual
    state is honest.
18. As a web user, I want re-enabling an inactive filter to apply it again, so that I can
    toggle filters on and off.
19. As a web user, I want empty property/value to be rejected before saving, so that I do
    not create a filter that hides every request.
20. As a web user, I want IN filters to require at least one value, so that I do not save
    a filter that matches nothing by accident.
21. As a web user, I want chips to show `empty` for a blank property or value, so that
    legacy/edge filters remain readable.
22. As a web user, I want custom filters to persist across reloads, so that my filter setup
    survives.
23. As a web user, I want filters to be scoped to the current project's log view, so that
    switching projects does not carry filters across.
24. As a web user, I want the request list to refresh after a filter change, so that I see
    the filtered result immediately.
25. As a web user, I want a clear error toast if a filter save/delete fails, so that I know
    the list was not updated.
26. As a keyboard user, I want Enter/Space to open a chip, and focus to move into the
    editor, so that I can use filters without a mouse.
27. As a keyboard user, I want Escape to close the editor and focus to return to the
    originating chip/Add control, so that keyboard flow is predictable.
28. As a web user, I want the popover anchored to the chip and kept inside the viewport,
    so that it stays usable near the edges.
29. As a backend user, I want inactive filters to be skipped when the dynamic view is
    built and when filters are applied, so that the Active switch works after reload.
30. As a backend user, I want newly added simple filters to be autosaved, so that they
    survive a restart.
31. As a backend maintainer, I want deleting a filter that is not in the dynamic-view
    pipeline to be safe, so that a stale filter cannot turn delete into a 500.
32. As a maintainer, I want the desktop main-process log-filter copy to match the web
    backend, so that both flavours have the same filter semantics.

## Implementation Decisions

### Scope

- This step changes the **web** Request Log UI only. The desktop Request Log UI is not
  touched; the desktop main-process `logUtils`/`logFilterHandler` copies are updated only
  to keep the backend semantics in sync with the web backend.
- Custom filters are `SimpleFilterM` records attached to the first log view of the current
  project. Group filters, nested groups and `FAMILY` are not exposed in the editor.

### State and data flow

- Re-add the simple-filter reducers to the web log slice: add, modify and remove by id.
  Keep `resetLogFilter` for the initial log-view load.
- The page keeps a local editor draft plus an anchor element. The draft is a full
  `SimpleFilterM` created from the shared factory, so it has a UUID and the correct
  `type`; property/condition/value/activate are overridden.
- Create calls the existing add-filter endpoint, then dispatches the new filter and
  refetches the request list. Update calls the update endpoint with the same id, then
  dispatches the replacement and refetches. Delete calls the delete endpoint with the
  project and log-view ids, then dispatches removal and refetches.
- The list stays server-filtered. No client-side filtering of the paginated list is
  introduced.
- The initial log-view load continues to split `res[0].filters` into simple filters and
  preset filters.

### Filter bar and chips

- The custom chip group and `+ Add filter` sit after the status-family group and before
  the flexible spacer, preserving the design order.
- A chip renders property, condition symbol and value in the mono font. Active chips use
  the normal chip surface; inactive chips use a dashed border, transparent surface, a
  hollow ring and a struck-through value.
- A blank property or value renders `empty`. IN values render joined with `, `.
- Each chip has a nested remove button with its own hit area; clicking it removes the
  filter without opening the editor.
- The chip/Add control is keyboard reachable; Enter/Space opens the editor. The chip
  container and its remove button must be separate controls (no nested buttons).
- Chips are disabled until the log view has loaded, because mutations need its id.

### Editor popover

- A portal-based fixed popover, 348px wide, anchored below the originating chip or Add
  control and clamped into the viewport. Reposition or close on scroll/resize.
- Header: **Add filter** or **Edit filter**, plus a close control.
- Fields:
  - Property: free-form text input with a datalist of common paths
    (`req.method`, `req.path`, `req.headers.user-agent`, `req.query.`, `req.body.`,
    `res.status`, `res.body.`).
  - Condition: six fixed options in the order EQUAL, NOT_EQUAL, CONTAINS, GREATER, LESS,
    IN. Labels show the symbol and enum, e.g. `$contains (CONTAINS)`. Exclude `FAMILY`.
  - Value: text input for normal conditions; a tags input for IN. Tags are trimmed,
    empty values dropped, and stored as `string[]`.
  - Active: the shared Toggle.
- Footer: Delete (edit only) on the left; Cancel and Done/Add filter on the right.
- Validation: property must be non-empty after trim; normal value must be non-empty; IN
  must have at least one tag. The primary button is disabled until valid.
- Saving normalizes the draft (trim property, single value or IN array) and calls the
  page's save handler. Delete removes immediately with no confirmation, matching the
  design.
- Opening focuses the first field; closing restores focus to the originating control.
  Escape, Cancel, outside click and the close control discard the draft.
- If saving/deleting is in flight, the primary/delete buttons show a busy state and
  prevent duplicate submissions.

### Active semantics and backend correctness

- Inactive filters remain persisted but are not applied to the dynamic view.
- The dynamic-view reconciliation skips filters with `activate === false` and removes
  pipeline entries for filters that are inactive or no longer present.
- Add applies the filter only when active; update applies it when active and removes it
  when inactive; delete removes it safely even if the pipeline entry is missing.
- Adding a simple filter and the first-time preset append mark the log-view collection
  dirty so Loki autosave persists the change.
- Mirror the dynamic-view reconciliation/removal/active behavior in the desktop
  main-process copy; mirror the controller changes in the desktop log-filter handler.
- The page's existing `hasActiveFilters` already counts only active simple filters; keep
  that semantics.

### Tests

- Backend tests cover active/inactive simple filters through the controller: an inactive
  filter does not narrow the list, activating it narrows the list, deactivating it restores
  the list, and deleting it removes it.
- Backend tests cover add/update/delete persistence and the dirty flag where practical,
  following the existing controller test suite.
- No frontend automated test harness exists; web UI verification is manual.
- Lint, type-check and web build are the renderer regression checks.

## Out of Scope

- Redesigning the desktop Request Log UI or adding custom filters to it.
- Group filters, nested filter groups, conjunctions and the `FAMILY` condition in the
  editor.
- Client-side filtering of the paginated request list.
- Copy-as-cURL, per-log delete, or any change to the Clear-logs behavior.
- Changes to the preset expectation/method/status filters beyond keeping them
  server-persisted.
- A new filter list endpoint; filters continue to arrive with the log-view response.
- Automated renderer tests.
- Light theme.

## Further Notes

- The design documents are slightly ambiguous about whether Add creates an empty filter
  immediately. The implemented decision is confirm-on-save, matching
  `design-notes.md` and the demo's actual script; it avoids orphan empty filters.
- The old UI applied edits live with a one-second debounce. The new popover applies on
  Done, so no debounce is needed.
- Tags are used for IN because they preserve values containing commas; the chip still
  renders the joined value.
- The backend `activate` gap and the missing dirty flag are pre-existing defects exposed by
  this feature, not new behavior.
- Work happens on `feature-new-ui-filter` in the `feature-new-ui-filter` worktree.
