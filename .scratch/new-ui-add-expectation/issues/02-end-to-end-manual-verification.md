# 02: End-to-end manual verification

**What to build:** A single walkthrough confirming the Add Expectation flow works against the running web dashboard and has not disturbed the rest of the page.

**Blocked by:** 01 (Add Expectation dialog).

**Status:** ready-for-agent

- [ ] The Add Expectation button is visible above the search field and reachable by keyboard.
- [ ] The modal opens, focuses the Name field, and closes via Cancel, X, Esc and backdrop click without creating anything.
- [ ] Tab focus stays inside the modal while open and returns to the Add button after closing.
- [ ] Creating with a name, a description and a chosen group produces a row under that group in match order, selected, with a Response badge.
- [ ] Creating with an empty name produces a row named "New expectation".
- [ ] Creating while ungrouped places the row in the Ungrouped section.
- [ ] Creating with a search term active clears the search and shows the new row.
- [ ] The new expectation's detail shows the default action (200 / JSON) and "no matchers".
- [ ] A failed create (e.g. backend stopped) shows an error toast and does not create a row.
- [ ] The rest of the page (selection, group collapse, search, Request Log / Config inside the shell) still works.
- [ ] Any issue found is fixed or filed before this ticket is closed.
