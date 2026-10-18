# 06: End-to-end verification

**What to build:** Verify the ported onboarding and project-settings flows in the running
desktop app, confirm the web front-end is unchanged and still builds, and leave the
branch pushed.

**Blocked by:** 01, 02, 03, 04, 05

**Status:** done

- [x] Desktop lint, renderer typecheck and renderer build pass.
- [x] Web lint and build pass.
- [x] Backend test suite passes.
- [x] Electron smoke covers Welcome with no projects, first-project creation, AppBar New
      project, Project settings save, running-state locks, delete confirmation, deleting
      the last project and the `#/config` fallback.
- [x] Screenshots are captured for the key flows.
- [x] The work is committed and pushed to desktop-new-ui.

## Verification evidence

Static checks:

- `yarn workspace livemock-desktop lint` — pass.
- `yarn tsc -p desktop/tsconfig.json` — pass.
- `yarn workspace livemock-desktop exec vite build` — pass.
- `yarn workspace front-end lint` — pass.
- `yarn workspace front-end build` — pass.
- `yarn workspace livemock test` — 33 suites, 145 tests pass (backend only; existing teardown warning).

Electron smoke (fresh empty dev profile):

- Welcome with no projects shows the brand-only top bar, welcome heading, New project
  card and the shared project form.
- The form rejects an empty name, an invalid port and a max request log below 1000 with
  the expected inline errors.
- Creating the first project enters the shell with that project selected.
- AppBar New project opens the same form, creates a second project and refreshes the
  dropdown.
- The gear opens Project settings with name, Port, Max request log and Description.
- Saving changes updates the app-bar project name and closes the modal.
- While running, Port and Delete project are disabled with the stop-first hints.
- Delete opens the type-the-name confirmation; a mismatch shows `incorrect project name`.
- Deleting switches to the first remaining project; deleting the last project returns to
  Welcome.
- `#/config` falls through the catch-all route to `#/expectation`.

Screenshots (local evidence, not committed):

- `/tmp/opencode/settings-01-welcome.png`
- `/tmp/opencode/settings-03-new-project.png`
- `/tmp/opencode/settings-05-settings-modal.png`
- `/tmp/opencode/settings-06-running-locks.png`
- `/tmp/opencode/settings-07-delete-confirm.png`
- `/tmp/opencode/settings-08-last-deleted.png`
