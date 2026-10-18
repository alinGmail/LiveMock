# 04: Add an action when there is none

**What to build:** An expectation with no action offers an "Add action" control that creates a sensible default and opens the editor on it.

**Blocked by:** 02 (Edit the expectation's action).

**Status:** ready-for-agent

- [ ] When the selected expectation has no action, the detail Action card shows an Add action control (alongside the existing "no action" state).
- [ ] Activating it creates a default custom-response action (status 200, JSON, empty body, no headers) through the existing create endpoint.
- [ ] On success the created action is added to the renderer state and the action editor opens on it.
- [ ] On failure an error toast is shown and nothing is added.
- [ ] Web only; no shared core, backend or desktop changes.
