# 02: New project dialog uses the shared form

**What to build:** The AppBar project dropdown's New project action opens a modal that
uses the same project form as the Welcome page, with the same validation and submitting
state. Creating a project closes the modal, shows a success toast and refreshes the
project list.

**Blocked by:** 01 (uses the shared project form)

**Status:** done

- [x] New project opens a modal titled New project with the shared form.
- [x] Validation matches the Welcome page.
- [x] Submit is disabled while creating and the label reflects the in-flight state.
- [x] Success closes the modal, shows a toast and refreshes the project list.
- [x] Failure keeps the modal open and shows an error toast.
