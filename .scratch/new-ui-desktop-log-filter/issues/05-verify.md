# 05: End-to-end verification

**What to build:** Verify the desktop custom-filter flows in the running app, confirm the
existing Request Log live and pagination behaviour still works, and leave the branch
pushed.

**Blocked by:** 01, 02, 03, 04

**Status:** done

- [x] Desktop lint, renderer typecheck, Electron typecheck and renderer build pass.
- [x] Web lint and build pass.
- [x] Backend test suite passes.
- [x] Electron smoke covers add, cancel/Escape/outside discard, edit, IN tags,
      active/inactive, remove via chip and editor, reload persistence, project switch,
      empty state and keyboard flow.
- [x] Existing live updates, pause/resume, pagination, clear logs, columns and
      mock-from-log still work.
- [x] Screenshots are captured for the key flows.
- [x] The work is committed and pushed to desktop-new-ui.

## Verification evidence

Static checks:

- `yarn workspace livemock-desktop lint` — pass.
- `yarn tsc -p desktop/tsconfig.json` — pass.
- `yarn workspace livemock-desktop tsc` — pass.
- `yarn workspace livemock-desktop exec vite build` — pass.
- `yarn workspace front-end lint` / `build` — pass.
- `yarn workspace livemock test` — 33 suites, 145 tests pass (backend only; existing teardown warning).

Electron smoke (copied dev profile, not the real one):

- Add opens with `req.path` / `CONTAINS` / empty value / Active on.
- Adding `req.path $contains /api/items/11` narrows the list to 9 rows, all matching.
- Editing the value to `/api/items/117` narrows the list to 1 row.
- Disabling Active gives the dashed/hollow/struck-through chip and restores the list;
  re-enabling narrows it again.
- Switching the condition to IN converts the value to a tag; adding
  `/api/items/116` shows the comma-joined chip and returns 2 rows.
- Cancel, Escape and outside mousedown discard the draft with no persisted filter.
- Removing via the chip `x` and via the editor Delete both restore the list.
- Reloading the page keeps the filter and the filtered list.
- Switching to another project clears the chips; switching back reloads the filter.
- A filter with no matches shows "No matching requests".
- Opening Add focuses and selects the property input; Escape restores focus to Add.
- Pause/Resume still works and the Columns menu still opens.
- Focus-on-open was fixed on desktop in `e07619b` after verification found the web
  component focuses before the hidden popover is measured.

Screenshots (local evidence, not committed):

- `/tmp/opencode/filter-01-logpage.png`
- `/tmp/opencode/filter-02-add-editor.png`
- `/tmp/opencode/filter-03-added.png`
- `/tmp/opencode/filter-05-edited.png`
- `/tmp/opencode/filter-06-inactive.png`
- `/tmp/opencode/filter-09-in-mode.png`
- `/tmp/opencode/filter-10-in-added.png`
- `/tmp/opencode/filter-12-project-switch.png`
- `/tmp/opencode/filter-13-empty.png`
