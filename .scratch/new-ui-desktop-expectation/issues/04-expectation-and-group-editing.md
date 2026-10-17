# 04: Expectation and group editing

**What to build:** Restore the redesign’s expectation and group editing flows on top of
the new master–detail page. A desktop user should be able to create an expectation, edit
its name and description, change delay/priority/group/active state in one dialog, toggle
activation from the detail header, and create or edit groups.

**Blocked by:** 03: Expectation master–detail read view.

**Status:** ready-for-agent

- [ ] “Add Expectation” opens a dialog with name, optional description and group; creating
      adds a default custom-response action, closes the dialog, refreshes the list and
      selects the new expectation.
- [ ] The detail header can edit the expectation name, and the detail pane can edit the
      description; both save through the existing generic expectation update and update
      Redux immediately.
- [ ] The Timing & state dialog edits delay, priority, group and active state in one save.
- [ ] The detail header’s active toggle updates optimistically, rolls back with a toast
      on failure, and prevents conflicting concurrent toggles.
- [ ] The toolbar and group header can open a group dialog to create or edit a group’s
      name, priority and active state; group names are validated against the other groups.
- [ ] The group header’s activation toggle updates the group and refreshes the list.
- [ ] Create/save buttons prevent duplicate submissions while a request is in flight, and
      failures surface a toast instead of silently closing the dialog.
- [ ] No Import, duplicate, delete-expectation or delete-group control is introduced.
