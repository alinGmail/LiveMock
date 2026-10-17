# 05: Expectation page — read-only detail pane

**What to build:** The Expectation page's right pane shows the selected expectation's full configuration, read-only, following the redesign: description, matchers, action and timing/state. This is what makes row selection useful.

**Blocked by:** 04 (Expectation page — read-only master list).

**Status:** ready-for-agent

- [ ] The detail pane renders the currently selected expectation.
- [ ] The header shows a breadcrumb (group / Expectation), the expectation name, an activation control (disabled), and summary chips for group, delay, priority and status.
- [ ] A Description card shows the full description read-only, with a muted state when empty.
- [ ] A Matchers card lists every matcher as typed chips (type, optional name, condition, value), with a muted "no matchers" state.
- [ ] An Action card shows the first action's type and configuration for all action types (custom response, proxy, static directory), with a muted "no action" state and no editing controls.
- [ ] A Timing & state card shows delay, priority, group name (or "ungrouped") and active state.
- [ ] The selection is kept across data refetches when the selected expectation still exists.
- [ ] The detail pane shows a "select an expectation" state only when the list itself is empty.
- [ ] Only the first action is displayed; the underlying actions array is left intact for future multi-action support.
- [ ] No editing controls appear anywhere in the detail pane.
