# 01: Shared project form and first-run Welcome page

**What to build:** A desktop project form that mirrors the web redesign's fields and
validation, and a first-run Welcome page that uses it. With no projects, the app shows a
brand-only top bar, the welcome heading and a New project card; creating the first
project enters the main shell.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] The form has Project name, Port, Max request log and Description with the web
      validation: name required, Port 1–65535, max request log at least 1000.
- [x] Submit is disabled while creating and shows a creating label.
- [x] The Welcome page shows a brand-only top bar (logo and LiveMock) and the centred
      Welcome to LiveMock heading and New project card.
- [x] Creating the first project shows a success toast, refreshes the project list and
      enters the main shell.
- [x] A failed create shows an inline error and leaves the form usable.
- [x] No account, username or sign-out controls appear.
