# 05: End-to-end manual verification

**What to build:** A single walkthrough confirming action editing works end to end on the web dashboard and that the refactor did not regress the rest of the page.

**Blocked by:** 02 (Edit the expectation's action), 03 (Delete an action), 04 (Add an action when there is none).

**Status:** ready-for-agent

- [ ] The Add Expectation dialog still works after the modal primitive extraction (open, autofocus, create, Esc/backdrop, focus return).
- [ ] The pencil on the first action opens the editor; each of the three type forms shows its fields.
- [ ] Switching type resets the fields to that type's defaults while keeping the action id.
- [ ] Cancel, X, Esc and a backdrop click close without saving.
- [ ] Editing and saving a custom response updates the detail and list (status, content type, body, headers, content handler).
- [ ] Editing and saving a proxy and a static-directory action updates the detail and list.
- [ ] A save failure (e.g. backend stopped) shows a toast, keeps the editor open with the draft, and re-enables Save.
- [ ] Deleting an action confirms first, then removes it; the card shows the no-action state when it was the only action.
- [ ] Add action creates the default response and opens the editor on it.
- [ ] Keyboard focus is trapped in the modal and returns to the trigger on close.
- [ ] The rest of the page (selection, group collapse, search, Add Expectation, Request Log / Config) still works.
- [ ] Any issue found is fixed or filed before this ticket is closed.
