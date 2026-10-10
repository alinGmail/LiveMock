# 03: Delete an action

**What to build:** A mock author can remove the expectation's action, with a confirmation, ending in the no-action state when it was the only one.

**Blocked by:** 02 (Edit the expectation's action).

**Status:** ready-for-agent

- [ ] When an action exists, the detail Action card shows a delete (trash) button.
- [ ] Clicking it asks for confirmation using the app's existing confirmation pattern; cancelling does nothing.
- [ ] Confirming calls the existing delete endpoint for the action.
- [ ] On success the action is removed from the renderer state, so the detail and list reflect it immediately.
- [ ] When the deleted action was the only one, the card returns to the "no action" state (with the Add action control).
- [ ] On failure an error toast is shown and nothing is removed.
- [ ] Web only; no shared core, backend or desktop changes.
