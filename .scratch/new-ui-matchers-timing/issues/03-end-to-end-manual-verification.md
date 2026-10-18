# 03: End-to-end manual verification

**What to build:** A single walkthrough confirming matcher and timing editing work end to end on the web dashboard and that nothing else regressed.

**Blocked by:** 01 (Edit matchers panel), 02 (Edit Timing & state panel and interactive header switch).

**Status:** ready-for-agent

- [ ] The Matchers edit button opens the panel; each matcher row shows type, condition and the correct name/value visibility.
- [ ] Adding a matcher appends a default path matcher; deleting one removes it.
- [ ] Switching a matcher's type resets its fields to that type's defaults and keeps it in place.
- [ ] Saving matchers persists them (reload shows the change) and the detail reflects it immediately.
- [ ] Cancel / X / Esc / backdrop discard matcher edits.
- [ ] The Timing & state edit button opens its panel; delay/priority accept numbers, empty/negative become 0; the group select lists ungrouped plus the project's groups; active toggles.
- [ ] Saving timing persists delay/priority/groupId/activate (reload shows the change) and the detail and list order update.
- [ ] The header Active switch toggles immediately and persists.
- [ ] A save failure (e.g. backend stopped) shows a toast, keeps the panel open with the draft, and re-enables Save.
- [ ] Keyboard focus is trapped in each panel and returns to the triggering button on close.
- [ ] The rest of the page (selection, search, group collapse, action/description editing, Add Expectation) still works.
- [ ] Any issue found is fixed or filed before this ticket is closed.
