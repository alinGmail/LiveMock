# 03: Expectation master–detail read view

**What to build:** Replace the old editable Expectation table with the redesign’s
master–detail page in read-only form. A desktop user should be able to scan a grouped,
searchable, match-order-faithful list on the left and inspect the selected expectation’s
description, matchers, first action and timing/state on the right. Data must come through
the existing desktop IPC layer. Editing controls are not part of this ticket; they are
added by the next two tickets.

**Blocked by:** 02: New desktop shell.

**Status:** ready-for-agent

- [ ] The Expectation route renders the two-pane redesign instead of the old antd table,
      with the first expectation selected by default and the selected row highlighted.
- [ ] The list is grouped by the shared match-order helper: groups ordered by priority,
      members ordered by priority, ungrouped expectations in an “Ungrouped” section, with
      collapsible group headers showing name, count, priority and activation state.
- [ ] Each row shows an active-state dot, name, description or a muted “no description”
      placeholder, delay tag and first-action type badge; inactive expectations and
      members of inactive groups are de-emphasised.
- [ ] The search field filters by name, description, group name and matcher text, and
      filtering the selected row out keeps its detail visible.
- [ ] The detail pane shows the breadcrumb, name, active/delay/priority summary,
      description, matcher chips, first-action summary and timing & state; it shows clear
      empty states for no expectations, no matchers and no action.
- [ ] Expectations are loaded through the existing desktop IPC wrapper and React Query /
      Redux path; no HTTP client or web server module is used.
- [ ] Existing expectations without a stored description render correctly.
- [ ] No editing control that would not work yet is shown as enabled.
