# 01: Project id in the URL (route grammar + guard + redirects)

**What to build:** Opening `#/project/<id>/expectation` or `#/project/<id>/requestLog` shows that
project's page; reloading, sharing and Back/Forward preserve the project; the project dropdown
navigates to the other project's URL; every legacy entry point redirects into the new shape; a
stale or deleted project id falls back to the first project with a notice.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Both flavors match `project/:projectId/expectation` and `project/:projectId/requestLog`;
      the web flavor keeps `settings` and the `config` alias outside the project segment.
- [x] A route guard resolves `projectId` during render and redirects to the first project's
      `expectation` when the id is missing from the list, showing a `Project not found` notice
      only when an id was actually present.
- [x] Redirects (all `replace`): bare `project/<id>` → its `expectation`; unknown page under a
      project → its `expectation`; `#/` and `#/expectation` → first project's `expectation`;
      `#/requestLog` → first project's `requestLog`; `#/config` → `#/settings`.
- [x] The guard writes a `currentProjectId` mirror into the project slice for non-React consumers;
      `curProjectIndex` keeps working untouched, so pages and the top bar render exactly as before.
- [x] The top bar's page links carry the project segment, and its project menu items navigate to
      `project/<otherId>/<current page>` (pushing history, so Back returns to the previous project).
- [x] Switching project keeps the current page segment.
- [x] Deleting the current project refreshes the list and navigates to the first remaining
      project; deleting the last project shows the welcome page.
- [x] No REST path, socket payload, MCP tool signature or backend file changes.
- [x] Both flavors typecheck/build; manual walkthrough of the redirect table passes.

## Notes

Implemented in both flavors: a `ProjectRoute` guard resolves `:projectId` during render, mirrors the
resolved id into the store in a layout effect, and redirects with `LegacyRedirect` for URLs that do
not name a project. The top bar's page links are prefixed and its project menu items are real
links to `project/<id>/<current page>`.

Verified: renderer typecheck for both flavors, `yarn workspace front-end lint`, `yarn
workspace livemock-desktop lint`, `yarn web-build`. Browser walkthrough of the redirect table is
still pending (no automation harness in the repo).
