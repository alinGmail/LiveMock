# 06: End-to-end manual verification

**What to build:** A single walkthrough that confirms the redesigned shell and Expectation page behave correctly together on the web dashboard, and that this step has not regressed the rest of the app.

**Blocked by:** 03 (New app shell and forced dark theme), 04 (Expectation page — read-only master list), 05 (Expectation page — read-only detail pane).

**Status:** ready-for-agent

- [ ] The app opens dark, with the new app bar and no left navigation.
- [ ] Switching projects and starting/stopping the listener update the app bar state correctly.
- [ ] The Expectation page shows grouped, correctly ordered expectations; collapse/expand, row selection, the detail pane and search all work.
- [ ] An expectation saved without a description and a project created before this change both render correctly.
- [ ] The Request Log and Config pages still load their existing content inside the new shell.
- [ ] Logout works from the overflow menu.
- [ ] No expectation editing is reachable from the Expectation page.
- [ ] Keyboard navigation reaches the shell and list controls with visible focus.
- [ ] Any issue found is either fixed or filed as a follow-up ticket before this ticket is closed.
