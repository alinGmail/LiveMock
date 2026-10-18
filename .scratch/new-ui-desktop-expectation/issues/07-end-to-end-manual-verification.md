# 07: End-to-end manual verification

**What to build:** Verify the finished desktop redesign as a real Electron user would use
it, covering the shell, the Expectation page, the preserved pages and desktop-specific
behaviour. Record the checks and any accepted visual mismatch on the old pages.

**Blocked by:** 06: Remove legacy expectation UI and verify integrations.

**Status:** ready-for-agent

- [ ] Launch the desktop app and confirm it opens in the dark redesign with the new app
      bar, Fira fonts and no left navigation.
- [ ] Verify project switch, New project, Expectation / Request Log tabs, gear → Project settings,
      status pill, start/stop, native menu and About.
- [ ] Verify the Expectation read view: match-order grouping, ungrouped section, collapse,
      selection, search, empty states, inactive de-emphasis, description, matcher chips,
      first-action summary and timing/state.
- [ ] Verify editing: add expectation and select-after-create, name, description,
      timing/state, active toggle, group create/edit/toggle, matcher add/edit/remove,
      action edit/delete/add.
- [ ] Verify compatibility: existing records without a description, Request Log live
      behaviour, “Mock this request”, project settings edit/delete, first-run welcome and
      the detached request-log detail window. (The Config page was later replaced by the
      Project settings modal in `new-ui-desktop-settings`.)
- [ ] Verify the default/minimum window size and the stacked layout below the responsive
      breakpoint, with no horizontal overflow.
- [ ] Confirm there are no console errors during the smoke test and that the removed
      Import and multi-action controls remain absent by design.
- [ ] Verify the follow-up expectation actions — group actions menu, clone, delete
      expectation and delete group — using ticket 15.
