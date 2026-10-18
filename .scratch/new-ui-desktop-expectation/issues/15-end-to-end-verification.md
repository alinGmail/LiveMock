# 15: End-to-end verification of the ported expectation actions

**What to build:** Verify the ported group actions, clone, delete expectation and delete group flows in the running desktop app, and verify the web change still builds. Capture screenshots for the key interactions, confirm no regressions in existing create/edit/activate behavior, and leave the branch pushed.

**Blocked by:** 08, 09, 10, 11, 12, 13, 14

**Status:** ready-for-agent

- [ ] Desktop lint and renderer typecheck pass.
- [ ] Web lint and build pass.
- [ ] Electron smoke covers the group menu, locked new expectation, clone, delete expectation selection, delete group cascade, search-time counts and blank-name fallback.
- [ ] Existing create, edit and activate flows still work.
- [ ] Screenshots are captured for the key flows.
- [ ] No IPC, backend or core change was required.
- [ ] The work is committed and pushed to desktop-new-ui.
