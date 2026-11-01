# 03: Desktop pages read the project from the URL

**What to build:** The desktop flavor behaves exactly like the web flavor after ticket 02: the
expectation page, the request log page and the top bar take the current project from the URL, and
no desktop component depends on a list index.

**Blocked by:** 02 (mirror the web implementation so the two flavors stay copies of each other).

**Status:** done

- [x] The desktop `useCurrentProject()` hook matches the web one in behaviour and shape.
- [x] The desktop expectation page, request log page and top bar use the hook; the desktop tree no
      longer reads `projectList[<index>]`.
- [x] The desktop expectation thunk's stale-response guard and the desktop request log page's
      project comparison use the same project identity.
- [x] Desktop builds (`tsc` for the main process and the renderer) and the manual walkthrough of
      the redirect table pass.

## Notes

Mirrors the web implementation. The desktop request log's `isCurrentProject` socket filter now
compares against the same project identity instead of a list index.
