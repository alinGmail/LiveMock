# 05: End-to-end verification

**What to build:** Verify the desktop custom-filter flows in the running app, confirm the
existing Request Log live and pagination behaviour still works, and leave the branch
pushed.

**Blocked by:** 01, 02, 03, 04

**Status:** ready-for-agent

- [ ] Desktop lint, renderer typecheck, Electron typecheck and renderer build pass.
- [ ] Web lint and build pass.
- [ ] Backend test suite passes.
- [ ] Electron smoke covers add, cancel/Escape/outside discard, edit, IN tags,
      active/inactive, remove via chip and editor, reload persistence, project switch,
      empty state and keyboard flow.
- [ ] Existing live updates, pause/resume, pagination, clear logs, columns and
      mock-from-log still work.
- [ ] Screenshots are captured for the key flows.
- [ ] The work is committed and pushed to desktop-new-ui.
