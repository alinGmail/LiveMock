# 02: Web pages read the project from the URL

**What to build:** On the web flavor, the expectation page, the request log page and the top bar
take the current project from the URL (falling back to the last resolved project for pages outside
the project segment) instead of from a list index, so the URL is the only truth. Switching
projects no longer shows the previous project's request detail.

**Blocked by:** 01 (the project segment and the guard have to exist first).

**Status:** done

- [x] A `useCurrentProject()` hook resolves the project from the `projectId` route param, falls
      back to the slice mirror for pages without a project segment (settings), and returns
      `null` when neither resolves.
- [x] The expectation page, the request log page and the top bar use the hook; nothing in the web
      tree reads `projectList[<index>]` any more.
- [x] The expectation thunk's stale-response guard compares against the same project identity that
      the pages use.
- [x] Changing project resets the selected request log in the web request log page, matching the
      desktop flavor, so a detail pane can never show the previous project's request.
- [x] Behaviour of the expectation list, request log list, detail panes, top bar and settings page
      is unchanged apart from the reset above.

## Notes

`useCurrentProject()` (non-null, for pages under the guard) and `useOptionalCurrentProject()` (for
the top bar, which also shows on the settings page) resolve from the route param first and the
store mirror second. The web request log now clears preset filters and the selected log on project
change.

Review follow-up: the reset now also clears the log list and guards the default-select effect and
the detail fallback on the project the list was fetched for — clearing only the Redux selection was
not enough, because the default-select effect re-picked the previous project's newest log.
