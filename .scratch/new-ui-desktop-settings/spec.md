# Desktop onboarding and project settings parity

## Context

The web front-end already ships the redesigned first-run Welcome page, the New project
dialog and the Project settings modal. The desktop app still uses the old antd
`ProjectEditor` for the first project and the AppBar's New project dialog, and it still
routes the gear to a separate Config page with debounced auto-save.

This step ports the web implementation to the desktop flavour. The web front-end is the
source of truth and must not change.

## Scope

- First-run Welcome page: brand-only top bar, centred welcome card and the new project
  form.
- AppBar New project dialog: same project form and validation as the Welcome page.
- Project settings: the gear opens a modal instead of a page; explicit Save changes,
  running-state locks, Danger zone and type-the-name delete confirmation.
- Remove the old Config page, `ProjectEditor`, its helpers and the `/config` route.

## Decisions

- Web is the design source; desktop-only adaptations are limited to the IPC data layer
  and the absence of an account system.
- The Welcome page has a brand-only top bar (logo + product name); no username and no
  sign-out, because the desktop app has no auth.
- Project settings use explicit Save changes; debounced auto-save is removed.
- Port and delete are disabled while the project is running.
- Deleting the last project returns the app to the Welcome page.
- The gear opens the settings modal; `/config` is removed and falls through the existing
  catch-all route.

## Out of scope

- Any web front-end change.
- Authentication, accounts, sign-out and the web account Settings page.
- Request Log and Expectation pages.
- Keeping the old Config page or `ProjectEditor` as a fallback.

## Verification

Desktop lint, renderer typecheck, desktop renderer build, web lint/build, the backend
test suite, and an Electron smoke test covering Welcome, New project, Project settings,
running-state locks and project deletion.
