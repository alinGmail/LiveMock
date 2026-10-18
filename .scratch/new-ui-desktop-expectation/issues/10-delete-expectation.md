# 10: Delete expectation from the detail header

**What to build:** The selected expectation's detail header gets a trash action that opens a shared destructive confirmation dialog with a red badge, the expectation name and a consequence note. Confirming deletes the expectation through the existing API, removes the row immediately and moves the selection to the row that takes its place (or the previous row, or no selection). Request logs are preserved. The confirmation dialog is a reusable primitive that group deletion can also use.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] The confirmation shows the correct title, name and consequence note; Cancel closes without deleting.
- [x] Confirming deletes the expectation, shows a success toast and removes the row.
- [x] Selection moves correctly after deleting a middle row, the last row and the only row.
- [x] While deleting, both buttons are disabled and the confirm label reads "Deleting…"; a failure keeps the dialog open and shows an error.
- [x] Request logs remain after deletion.
- [x] The confirmation is a reusable primitive, with header-icon support in the desktop modal shell.
