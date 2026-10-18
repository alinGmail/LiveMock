# 15: End-to-end verification of the ported expectation actions

**What to build:** Verify the ported group actions, clone, delete expectation and delete group flows in the running desktop app, and verify the web change still builds. Capture screenshots for the key interactions, confirm no regressions in existing create/edit/activate behavior, and leave the branch pushed.

**Blocked by:** 08, 09, 10, 11, 12, 13, 14

**Status:** done

- [x] Desktop lint and renderer typecheck pass.
- [x] Web lint and build pass.
- [x] Electron smoke covers the group menu, locked new expectation, clone, delete expectation selection, delete group cascade, search-time counts and blank-name fallback.
- [x] Existing create, edit and activate flows still work.
- [x] Screenshots are captured for the key flows.
- [x] No IPC, backend or core change was required.
- [x] The work is committed and pushed to desktop-new-ui.

## Verification evidence

Static checks:

- `yarn workspace livemock-desktop lint` — pass.
- `yarn tsc -p desktop/tsconfig.json` — pass.
- `yarn workspace front-end lint` — pass.
- `yarn workspace front-end build` — pass.
- `yarn workspace livemock-desktop exec vite build` — pass.
- `yarn workspace livemock test` — 33 suites, 145 tests pass (backend only; existing teardown warning).

Electron smoke (run against a copy of the dev profile, not the real one):

- Group menu shows Edit group, New expectation and Delete group; the danger item is separated and red.
- New expectation from the menu expands the group, locks the group selector and creates the row in that group; the new row is selected.
- Clone dialog is prefilled with `<name> (copy)`, description and group; cloning creates a new row and selects it.
- Delete expectation: Cancel is a no-op; deleting a middle row selects the next row; deleting the last row selects the previous row.
- Delete group: confirmation shows the pluralized member count; cascade removes all members; selection moves to the next surviving row; deleting an empty group shows the group-only note.
- Search `login` shows a group count of 2 and hides groups without matches.
- Blank-name create produces `New expectation`; blank-name clone produces `<source> (copy)`.
- Existing create/edit/toggle behavior was exercised while creating and selecting rows; no regressions observed.

Screenshots (local evidence, not committed):

- `/tmp/opencode/smoke-02-group-menu.png`
- `/tmp/opencode/smoke-03-new-in-group.png`
- `/tmp/opencode/smoke-05-clone-dialog.png`
- `/tmp/opencode/smoke-07-delete-dialog.png`
- `/tmp/opencode/smoke-09-delete-group-dialog.png`
- `/tmp/opencode/smoke-11-search-count.png`
