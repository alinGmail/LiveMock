# 01: Add Expectation dialog

**What to build:** A mock author can create a new expectation from the Expectation page. A primary "Add Expectation" button in the master toolbar opens the design's modal (Name, Description, Group); Create posts the expectation, the list refreshes, the new row is selected, and any active search is cleared. Cancel / X / Esc / backdrop close without creating.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A toolbar sits at the top of the list pane, above the search field, with a primary "Add Expectation" button (plus icon); the design's Add-group and Import buttons are not rendered.
- [ ] Clicking the button opens a modal rendered through a portal onto `document.body`, styled with CSS modules to match the redesign's small dark modal.
- [ ] The modal contains, in order: Name (text input), Description (textarea, optional), and a styled native select for Group listing "ungrouped" plus the current project's groups.
- [ ] The Name input is focused when the modal opens.
- [ ] The modal closes on Cancel, the X, Esc, and a backdrop click; none of these create an expectation.
- [ ] Keyboard focus is trapped inside the modal while open and returns to the Add button when it closes.
- [ ] Enter does not submit; Enter inside Description inserts a newline.
- [ ] Create builds an expectation with: trimmed name (or `"New expectation"` when empty), trimmed description, selected `groupId` or `null`, a single default custom-response action (200, JSON, empty body, no headers), and factory defaults for activate/priority/delay/matchers.
- [ ] Create posts through the existing create request for the current project.
- [ ] On success the expectation list is refetched, the new expectation is selected, and the search field is cleared.
- [ ] On failure an error is surfaced with the existing toast helper and the modal stays open.
- [ ] The Create button is disabled while the request is in flight.
- [ ] The new row appears in match order (under its group, or in the Ungrouped section) with a Response badge, and its detail shows the default action and "no matchers".
- [ ] No expectation edits, matchers/action editors, Add group or Import are introduced; the core model, backend and desktop flavor are unchanged.
