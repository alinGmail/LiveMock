# 02: New desktop shell

**What to build:** Replace the desktop project strip and left navigation with the
redesign’s top app bar and full-height content shell, adapted to desktop. The app should
open in the new dark shell, with working project navigation, page tabs, project settings
access and mock-listener controls. Request Log and Config must keep their current content
and behaviour inside the new shell, and the first-run welcome page must keep working
outside it.

**Blocked by:** 01: Redesign foundation and shared primitives.

**Status:** ready-for-agent

- [ ] The app renders a single top app bar containing the LiveMock brand, project
      dropdown, Expectation / Request Log tabs, project settings gear, status pill and
      start/stop control; the old project strip and left navigation are gone.
- [ ] The project dropdown lists projects with their status and port, switches the
      current project, and offers “New project” using the existing project editor dialog.
- [ ] The settings gear opens project settings without adding a visible page tab; the
      page tabs return to Expectation / Request Log. (Originally this was the Config page;
      the follow-up below replaced it with the Project settings modal.)
- [ ] The shell is forced to dark mode, the old light/dark toggle is no longer visible,
      and the Request Log and project settings still render and work in the dark shell.
- [ ] The main window opens at 1280×800 with a 960×640 minimum and the page still stacks
      its panes below the existing responsive breakpoint.
- [ ] The native Electron application menu, About window, detached request-log detail
      window and first-run welcome page continue to work.
- [ ] No account, sign-in or sign-out controls are shown in the app bar.

## Follow-up

`new-ui-desktop-settings` later replaced the project editor with the shared project form,
changed the gear to open the Project settings modal, and removed the Config page and
`/config` route.
