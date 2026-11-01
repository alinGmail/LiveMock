# Project id in the URL (URL state — step 1)

**Status:** done

## Problem Statement

The dashboard keeps its state entirely in memory: which project you are looking at is a Redux
array index, and which page you are on is the only thing that reaches the address bar. The
consequences are visible to every user:

- Reloading always drops you back on the first project, regardless of what you were doing.
- A link to the request log of project "Billing mock" is not shareable — the recipient lands on
  whatever project happens to be first in their own list.
- The browser Back button does not undo a project switch, because a project switch is not a
  navigation.
- Two projects cannot be open side by side in two tabs; the second tab silently overwrites the
  first one's context on the next reload.
- Because selection is stored as an index into a list that is refreshed from the server, any
  reorder of the project list changes which project is selected.

The deeper problem is that this is step 1 of a larger change: expectations and request logs should
also become addressable. That is only worth doing if the project segment has a URL grammar that
can nest the entities underneath it.

## Solution

Make the project a first-class part of the URL, ahead of the page segment:

```
#/project/<projectId>/expectation
#/project/<projectId>/requestLog
#/settings                      (global, web only)
```

The URL becomes the single source of truth for "which project am I looking at". Reloading,
sharing, bookmarking, Back/Forward and opening a second tab all work. Project switches become
real navigations, and the project dropdown items become real links that can be opened in a new
tab.

Old links keep working: `#/`, `#/expectation`, `#/requestLog` and `#/config` redirect into the new
shape, and a stale or deleted project id redirects to the first available project.

The REST API is untouched — it still receives the project id as a query parameter or body field.
Only the browser-facing route grammar changes.

## User Stories

1. As a mock author, I want the project id in the address bar, so that I can tell which project I
   am looking at from the URL alone.
2. As a mock author, I want to reload the page and stay on the same project and the same page, so
   that a reload does not cost me my context.
3. As a mock author, I want to copy the address bar and send it to a teammate, so that they open
   the same project's request log.
4. As a mock author, I want to bookmark a project's expectation list, so that I can jump straight
   back to it.
5. As a mock author, I want Back to return me to the previous project after I switch, so that an
   accidental switch is easy to undo.
6. As a mock author, I want Forward to return me to the project I came from, so that history works
   like a normal web app.
7. As a mock author, I want to open the same dashboard in a second tab on a different project, so
   that I can work across two mocks at once.
8. As a mock author, I want the project dropdown's items to be real links, so that I can
   middle-click or ⌘-click one into a new tab.
9. As a mock author, I want switching projects to keep me on the page I was on, so that comparing
   the request logs of two projects takes one click.
10. As a mock author, I want opening a project URL with no page segment to land on the expectation
    list, so that a bare project link is useful.
11. As a mock author, I want an old `#/expectation` bookmark to still work, so that upgrading does
    not break my habits.
12. As a mock author, I want an old `#/requestLog` bookmark to land on the request log of the
    first project, so that the page I bookmarked is the page I get.
13. As a mock author, I want an old `#/config` bookmark to reach the settings page, so that the
    rename of that route stays backward compatible.
14. As a mock author, I want a URL pointing at a deleted project to fall back to the first
    project, so that I never see a blank page.
15. As a mock author, I want a small notice when a project id in the URL does not exist, so that I
    understand why I was redirected instead of assuming a bug.
16. As a mock author, I want deleting the project I am looking at to move me to another project,
    so that I am not stranded on a dead URL.
17. As a mock author, I want deleting my last project to show the welcome page, so that I can
    create a new one.
18. As a mock author, I want the settings page to stay global (not nested under a project), so
    that account and token management is not tied to one project.
19. As a mock author, I want the project shown in the top bar to stay put while I am in settings,
    so that the navigation does not flicker.
20. As a mock author, I want a URL that names a project to always win over remembered UI state, so
    that what I share is what the other person sees.
21. As a mock author on the desktop app, I want the same URL behaviour, so that the two flavors do
    not drift apart.
22. As a mock author, I want switching back and forth between two projects to never show the other
    project's request detail, so that I cannot be misled by stale data.
23. As an MCP user, I want the REST API to keep accepting the project id the way it does today, so
    that existing MCP tools and API tokens keep working.
24. As a maintainer, I want no second source of truth for the current project, so that list
    refreshes cannot silently change which project is selected.
25. As a maintainer, I want the route grammar to leave room for expectation and request-log ids
    under the project segment, so that step 2 is an extension, not a rewrite.

## Implementation Decisions

### Route grammar

- Project segment first, page segment second: `project/:projectId/expectation`,
  `project/:projectId/requestLog`. Future entity routes nest under the same segment.
- The project is identified by its UUID (`project.id`), not by name. No slug concept is
  introduced; renaming a project must not break links.
- `HashRouter` is kept in both flavors. Real paths would require a backend SPA fallback, a dev
  server fallback, and a custom protocol in the desktop build (which loads the renderer from
  `file://`); that is a separate decision.
- `settings` stays outside the project segment and only exists in the web flavor.

### Redirects

All redirects use `replace` so history does not fill with hops.

| Incoming | Target |
| --- | --- |
| `project/<id>` with no page segment | `project/<id>/expectation` |
| `project/<id>/<unknown page>` | `project/<id>/expectation` |
| `#/`, `#/expectation` | first project, `expectation` |
| `#/requestLog` | first project, `requestLog` |
| `#/config` | `#/settings` |
| `project/<unknown or deleted id>/…` | first project, `expectation` + a `Project not found` toast |

When the project list is empty the welcome page renders outside the router, as it does today.

### Source of truth

- The URL is authoritative. A route-level guard element resolves the `projectId` param against the
  loaded project list **during render**, and either renders its child route or redirects.
- The guard publishes the resolved project through React context (outlet context or a dedicated
  context) so pages read the current project synchronously during render. There is no
  "project is undefined for one frame" state.
- Redux keeps a `currentProjectId` mirror, written from the guard, for non-React consumers only
  (the expectation thunk's race guard and selectors). The index-based `curProjectIndex` field is
  removed once both flavors read the context; it must never coexist as a competing truth.
- Project switching navigates (`push`), preserving the current page segment.
- Creating a project navigates to that project's expectation page, so the create flow never relies
  on a redirect; the first-run welcome page does the same by writing the hash before the list
  update mounts the router.
- Deleting the current project removes it from the list locally first, navigates to the first
  remaining project, and then refreshes the list (so a failed refresh cannot leave the URL on a
  deleted project); deleting the last one falls through to the welcome page.
- On `#/settings`, the top bar keeps showing the last resolved project (the mirror is not cleared
  on navigation). A cold start directly on `#/settings` has no last project: the project area
  shows a placeholder and the start/stop control is hidden, while the dropdown remains usable and
  navigates into the chosen project.

### Cleanup

- The old index-based project switcher files in the web tree are dead code and are removed, along
  with the editor component only they use: `ProjectInfo`, `ProjectEditor`, and the equally unused
  `LeftNav` (a legacy page nav that still linked to the old `#/config` route). The helpers those
  files were the last importers of (`struct/common`, `project/common`) go with them.
- Request-log selection is reset when the project changes in the web flavor too, matching the
  desktop flavor — including the log list and the project-tagged guard, so the default-select
  effect cannot re-select a log from the previous project.

### Untouched

- REST paths, `projectId` query/body transport, sockets, the MCP package, the core structs and the
  backend are unchanged.

## Testing Decisions

- A good test drives externally observable behaviour: a URL in, a rendered page (or a redirect)
  out. It must not assert on component internals, state field names, or dispatch calls.
- **The seam question, stated honestly:** this change lives entirely in the two renderer trees,
  which have **no test harness at all**. The only automated seams in the repo are the backend's
  Jest suite and the MCP package's `node:test` suite, and neither is touched by this change.
  Introducing a renderer test stack was considered and rejected for this step: two new
  vitest + Testing Library setups to cover a routing redirect table is disproportionate, and the
  project-resolution logic is a handful of lines.
- The seam used is therefore the **running application**, exercised manually through the same
  kind of end-to-end walkthrough the repo already uses for UI work (`.scratch` specs record
  manual verification for renderer changes).
- Manual checklist, run against both `yarn web-dev` and `yarn desktop-dev`:
  1. Deep link to a non-first project's expectation list, then reload — same project, same page.
  2. Deep link to a project's request log, copy the URL, open it in a new tab — same view.
  3. Switch project from the dropdown — URL changes, page segment is preserved, Back returns to the
     previous project, Forward returns again.
  4. Middle-click a project in the dropdown — opens in a new tab on that project.
  5. `#/`, `#/expectation`, `#/requestLog`, `#/project/<id>` — each lands where the table above
     says.
  6. `#/project/<random-uuid>/expectation` — redirected to the first project with the toast.
  7. Delete the current project — lands on the first remaining project; delete the last one — the
     welcome page appears and creating a project lands on its URL.
  8. `#/settings` — the top bar keeps the previous project; a cold load of `#/settings` shows the
     placeholder and still allows picking a project.
  9. Switch projects while a request log is selected — the detail pane is empty, never showing the
     previous project's request.
  10. `yarn workspace front-end lint` and the desktop build/typecheck stay clean.

## Out of Scope

- Expectation ids and request-log ids in the URL (step 2 and step 3; the grammar above is designed
  to nest them).
- Making the REST API RESTful (`/api/project/:projectId/expectation`) and any change to the MCP
  tool surface.
- Switching either flavor to `BrowserRouter` / real paths, and the backend history fallback that
  would require.
- Remembering the last project across visits in `localStorage` — the URL now carries that
  information.
- Any change to the desktop flavor's settings story (it has no settings page).
- Per-project UI state inside a page (filters, query string, scroll position) being encoded in the
  URL.

## Further Notes

- Both renderer trees are near-copies; every behavioural change here lands twice (web and desktop),
  as required by the repo's four-tree rule.
- The web build is served under `/dashboard`, so the effective address is
  `/dashboard/#/project/<id>/expectation`.
- The redirect table lives in the route tables of the two `App` components plus the guard element;
  the top bar's project menu is the other place that constructs project URLs.
- Tracker convention: this spec lives at `.scratch/project-id-in-url/spec.md`; tickets live at
  `.scratch/project-id-in-url/issues/NN-<slug>.md`.

## Comments

**Code review (two axes) → fixes applied**

- *Spec (c)*: the web request log reset was ineffective — clearing the selection let the
  default-select effect re-pick `logs[0]` from the previous project. Now mirrors desktop: a
  `logsProjectIdRef` guard on the fetch, the select effect and the `selectedLog` fallback, plus
  `setLogs([])` / `setHasMore(false)` / editor reset on project change.
- *Spec (a)*: creating a project now navigates to its expectation page (top bar and first-run
  welcome page); the web delete flow was rewritten to match desktop (optimistic local removal,
  then refresh), so the two top bars' `onCreateProject` / `onDeleteProject` are byte-identical.
- *Standards*: route string building and the page-segment derivation now live in one
  `component/route/routes.ts` per flavor (`projectPath`, `pageSegmentFromPathname`,
  `useFirstProjectId`); the desktop hook doc comment matches the web one; the two helper files the
  deleted components were the last importers of are gone.
- *Standards (scope creep, resolved in docs not code)*: `LeftNav` was dead code and its removal was
  approved during grilling, so the decision text above was corrected rather than the file restored.
- Left open by design: `useCurrentProject()` asserts non-null because the route guard guarantees it;
  and the project id lives in both the URL and the store mirror (the mirror exists so non-React
  consumers and the top bar see it before paint).
