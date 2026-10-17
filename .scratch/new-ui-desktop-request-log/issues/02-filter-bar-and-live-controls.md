# 02: Filter bar and live controls

**What to build:** Add the redesign’s compact filter bar above the request stream:
expectation dropdown, method chips, status-family chips, live/paused indicator,
Pause/Resume, Clear and Columns popover. Filters must keep using the server-persisted
log-view presets and refetch the stream.

**Blocked by:** 01: Request stream and inline detail.

**Status:** ready-for-agent

- [ ] The expectation dropdown lists “All requests” plus the current project’s
      expectations and persists the expectation preset filter.
- [ ] GET/POST/PUT/DELETE method chips persist the methods preset filter and refetch the
      list.
- [ ] 2xx/3xx/4xx/5xx status-family chips persist the status preset filter and refetch the
      list.
- [ ] A live/paused indicator reflects the page state.
- [ ] Pause stops applying live list events; Resume refetches the first page to catch up.
- [ ] Clear asks for confirmation, calls the existing delete-all wrapper, refetches and
      clears the selected request.
- [ ] The Columns popover toggles expectation, duration and marker fields locally.
- [ ] Filter changes survive a reload through the existing log-view persistence.
- [ ] No OPTIONS chip, exact status-code input or custom-filter editor is introduced.
