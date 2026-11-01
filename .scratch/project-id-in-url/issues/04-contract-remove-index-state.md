# 04: Contract — remove the index-based project selection

**What to build:** With both flavors reading the URL, the index-based selection is deleted so that
a project-list refresh can no longer silently change the selected project. The settings page gets
its final top-bar behaviour, and the dead index-based project switcher code disappears.

**Blocked by:** 02 and 03 (nothing may still read the index while it is removed).

**Status:** done

- [x] `curProjectIndex` and its action are gone from both project slices; `currentProjectId` is the
      only project identity in the store.
- [x] The top bar's project menu takes its active state from the resolved project, and the delete
      flow no longer sets an index.
- [x] On `#/settings` the top bar keeps showing the last resolved project; a cold load of
      `#/settings` (nothing resolved yet) shows a placeholder in the project area, hides the
      start/stop control, and still lets the dropdown navigate into a project.
- [x] The dead index-based project switcher components and their styles, plus the editor only they
      use, are deleted from the web tree; nothing else references them.
- [x] `yarn workspace front-end lint` passes, the web build succeeds, the desktop build succeeds,
      and the backend test suite is still green (it should be untouched).

## Notes

`curProjectIndex` is gone from both slices; `currentProjectId` is the only project identity. The
start/stop control is rendered only when a project is resolved, so a cold load of `#/settings`
shows `No project` with no start/stop button. Removed `ProjectInfo`, `ProjectEditor` and `LeftNav`
(components and styles) from the web tree.

Review follow-ups: `LeftNav` is covered by the removal (dead legacy page nav), and the two helper
modules only the deleted components imported (`struct/common`, `project/common`) were removed too.
