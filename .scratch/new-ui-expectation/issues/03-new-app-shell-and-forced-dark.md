# 03: New app shell (top bar) and forced dark theme

**What to build:** The dashboard shell becomes the redesign's single top app bar, and the app runs in the design's dark theme only. The current top strip and left navigation are replaced. Existing Request Log and Config content keeps working inside the new shell.

**Blocked by:** 01 (Design token layer and self-hosted fonts).

**Status:** ready-for-agent

- [ ] A single top app bar replaces the current top strip and the left navigation; the left navigation is no longer rendered.
- [ ] The app bar shows the brand (product logo plus wordmark), a divider, the current project dropdown, page tabs, a spacer, the mock-listener status with start/stop, and an overflow menu.
- [ ] The project dropdown shows the current project name and, per project, its status and port; switching project works; creating a new project remains available.
- [ ] Page tabs switch between the Expectation page and the Request Log page via routing.
- [ ] The listener control reuses the existing start/stop requests and represents all four project states (started, stopped, starting, closing), with a running indicator and loading feedback while starting/closing.
- [ ] The overflow menu holds Logout and the app version.
- [ ] The Config page has no visible entry in this step and is reachable by URL only.
- [ ] The theme toggle is removed from the UI and the app is forced to dark; the theme-mode state and its setter remain in code, unrendered.
- [ ] The Request Log and Config pages still render their current content and behaviour inside the new shell, with no regression.
- [ ] Interactive controls have visible focus states and are keyboard-operable.
- [ ] The previous left-navigation collapse behaviour is no longer active.
