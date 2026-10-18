# 03: Project settings modal from the gear

**What to build:** The AppBar gear opens a Project settings modal instead of navigating to
a separate page. The modal edits name, Port, Max request log and Description with an
explicit Save changes action, locks Port and deletion while the project is running, and
offers a Danger zone whose delete action requires typing the project name.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] The gear opens the Project settings modal for the current project.
- [x] The modal shows the four project fields and a Save changes button.
- [x] Saving updates the project, closes the modal, shows a toast and refreshes the
      project list.
- [x] Port and delete are disabled while the project is not stopped, with a visible hint.
- [x] Delete opens a type-the-name confirmation; a mismatch shows an error and does not
      delete.
- [x] Deleting closes the modal, shows a toast and switches to the first remaining
      project; deleting the last project returns to Welcome.
- [x] A failed refresh after deletion does not leave the deleted project selected.
- [x] Closing the modal leaves the current project unchanged.
