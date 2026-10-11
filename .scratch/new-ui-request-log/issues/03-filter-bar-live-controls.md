# 03: Request Log filter bar and live controls

**What to build:** The compact filter bar above the request stream, wired to the existing server-side (persisted) log-view filters, plus Live / Pause / Resume / Clear.

**Blocked by:** 01 (Status-family log filtering), 02 (Request Log master stream and inline detail).

**Status:** ready-for-agent

- [ ] An expectation dropdown, method chips, and status-family chips (2xx/3xx/4xx/5xx) filter the stream.
- [ ] Each change updates the corresponding server-side log-view filter (EXPECTATION / METHODS / STATUS_CODE), persists it, and refetches; the chips initialize from the persisted filters on load.
- [ ] Custom filter chips and "Add filter" are not rendered (deferred).
- [ ] A Live indicator reflects the socket connection; Pause freezes applying incoming insert/update events; Resume refetches the list.
- [ ] Clear wipes the log via the existing delete-all request, with confirmation.
- [ ] A Columns popover toggles the per-row expectation / duration / marker fields.
- [ ] The old preset/custom filter components and the old column config/editor UI that this bar replaces are removed.
- [ ] Web only; no shared core, backend (beyond ticket 01) or desktop change.
