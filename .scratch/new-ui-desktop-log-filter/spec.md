# Desktop Request Log custom filters

## Context

The web front-end and backend gained custom Request Log filters in PR #50. The same merge
already ported the backend semantics to the desktop main process: active filters are
applied to the Loki dynamic view, inactive filters are skipped, stale pipeline entries
are removed safely, and filter changes mark the log view dirty for autosave.

The desktop renderer still has no custom-filter UI. It hydrates simple filters into Redux
and uses them for the empty state, but there are no chips, no Add control and no editor.
Persisted active filters therefore silently filter the desktop log list with no way to
inspect or remove them.

This step ports the web custom-filter renderer to `desktop/src`. IPC, preload, handlers,
the database, core types and the web front-end are already in place and stay unchanged.

## Scope

- Custom filter chips after the status-family chips, followed by a dashed Add filter
  control.
- A portal popover editor with property, condition, value, active state, and
  Delete / Cancel / Done.
- IN filters use a tag input and persist `string[]`; other conditions use a single
  trimmed string.
- Create, update and delete through the existing desktop log-filter IPC wrappers,
  followed by a log-list refetch.
- Active state honours `activate !== false`, matching the backend and web.
- Project switches clear the previous project's custom filters and close any open
  editor.
- The desktop's existing IPC live updates, pause/resume, pagination guards, clear-logs
  behaviour and selected-log guards are preserved.

## Decisions

- The web implementation is the source of truth; the editor component and styles are
  copied to desktop with no transport changes.
- `logSlice.logFilter` is narrowed to `SimpleFilterM[]`, matching web.
- The desktop keeps its own IPC live-update and pagination code; web socket code is not
  copied.
- The editor is a popover anchored to the chip or Add control, not a modal.
- The filter list remains server-applied; there is no client-side filtering.
- Project switches close the editor in addition to clearing filters, because the
  desktop page has a stronger project-reset effect than web.

## Out of scope

- Any web front-end, backend, core, preload or desktop main-process change.
- Group filters, nested filters, conjunctions or the FAMILY condition in the editor.
- Client-side filtering of the paginated list.
- Search or time-range controls; the page has neither.
- A clear-all-filters control, copy-as-cURL, per-log delete or Clear-logs changes.
- Redesigning the desktop Request Log page.
- Automated renderer tests; the repository has no renderer test harness.

## Verification

Desktop lint, renderer typecheck, Electron typecheck, renderer build, web lint/build, the
backend test suite, and an Electron smoke test covering add, cancel, edit, IN tags,
active/inactive, remove, reload persistence, project switching, empty state, keyboard
flow and the existing live/pause/clear behaviours.
