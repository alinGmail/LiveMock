# 04: Expectation page — read-only master list

**What to build:** The Expectation page's left pane becomes the redesign's grouped, order-faithful list of expectations, read-only. Selecting a row highlights it; group collapse/expand and client-side search work; all editing controls are gone.

**Blocked by:** 01 (Design token layer and self-hosted fonts), 02 (Expectation `description` field).

**Status:** ready-for-agent

- [ ] The page renders a read-only grouped list from the existing expectation and group data (same queries/state, no new data source).
- [ ] The displayed order equals the match order: groups by group priority then creation time, members by member priority then creation time, and ungrouped expectations as singletons on the same scale.
- [ ] A group header shows the group name, member count, priority and activation state, and can be collapsed/expanded (expanded by default).
- [ ] Ungrouped expectations appear in a clearly labelled "Ungrouped" section at their ordering position.
- [ ] An expectation row shows the activation dot, the name, the description line, the delay tag when delay is greater than zero, and the first action's type badge.
- [ ] When there is no description, the row shows a muted placeholder; when there are no actions, no badge is shown.
- [ ] Inactive expectations, and members of inactive groups, are visually de-emphasised but still readable.
- [ ] Clicking a row selects it and gives it a selected style; the first expectation is selected on first load.
- [ ] A client-side search filters by name, description, group name and matcher text; a search with no results shows a "No matches" empty state.
- [ ] An empty project shows an appropriate empty state.
- [ ] Add-expectation, add-group and import controls are not rendered; inline editing, delete and duplicate are not rendered; the group kebab menu is omitted.
- [ ] Activation switches are shown but disabled, reflecting state without being actionable.
- [ ] Layout is responsive: the master/detail panes stack below the design's breakpoint.
