# New UI — Expectation Page Display (step 1)

**Status:** ready-for-agent

> Source of truth: this conversation plus the static design demo under `new-ui/`
> (`design-notes.md`, `index.html`, `design-system/livemock-ui-redesign/MASTER.md`).
> Branch / worktree: `new-ui-expectation`.

## Problem Statement

The LiveMock redesign exists only as a static design demo (`new-ui/index.html`). The running web dashboard still shows the old UI: a flat, fully-editable antd `Table` on the Expectation page with no detail view, no selection, no search and no description on expectations. Mock authors therefore cannot benefit from the new, data-dense master–detail design, and they cannot tell similar expectations apart because an expectation has only a `name`.

Replacing the entire UI in one shot is risky. The user wants to adopt the redesign **incrementally**, and the first step is deliberately read-only: apply the new visual design to the app shell and show expectations in the new master–detail layout, without touching any editing flow. This lets the design land and be validated before the editing steps are ported.

## Solution

Adopt the new dark-only design for the app shell and the Expectation page in the **web dashboard only**.

- **Shell**: replace the current top strip + left navigation with the design's single top app bar (brand, project dropdown, page tabs, mock-server status + start/stop, overflow menu). Non-Expectation pages keep their current content and simply render inside the new shell.
- **Expectation page**: replace the editable table with the design's read-only master–detail view — a grouped, order-faithful list on the left and a detail pane on the right showing the selected expectation's description, matchers, action and timing/state.
- **New field**: an expectation gains an optional-in-practice `description`. It is displayed in the list row and the detail pane. Because this step is read-only, the description is not editable yet; it is persisted through the existing generic create/update paths so later steps can edit it.
- **Frozen editing**: creating, renaming, activating, re-prioritising, grouping, importing, deleting and duplicating expectations are out of this step. Navigation, row selection, group collapse/expand and client-side search remain live.
- **Dark only**: the design ships only a dark theme, so the app is forced into dark mode and the existing theme toggle is removed.

The result: the web dashboard looks like the redesign and expectations are pleasant to *read*, with editing deliberately deferred.

## User Stories

1. As a mock author, I want the Expectation page to use the new dark design, so that the dashboard looks and reads like the approved redesign.
2. As a mock author, I want a two-pane master–detail layout, so that I can inspect one expectation without losing the list.
3. As a mock author, I want the shell to be the new top app bar, so that the whole page matches the design rather than just the content.
4. As a mock author, I want each list row to show the name, description, activation state, delay and action type, so that I can scan expectations quickly.
5. As a mock author, I want a description field on every expectation, so that I can tell similar mocks apart.
6. As a mock author, I want a row to show a muted placeholder when there is no description, so that rows stay visually uniform.
7. As a mock author, I want expectations grouped under collapsible group headers ordered like the match engine, so that the list reflects precedence.
8. As a mock author, I want a group header to show the group name, its member count, its priority and its activation state, so that I can read a whole group at a glance.
9. As a mock author, I want ungrouped expectations collected in an "Ungrouped" section, so that they stay visible and ordered with the rest.
10. As a mock author, I want to click a row to select it, so that its detail appears on the right.
11. As a mock author, I want the first expectation selected by default, so that the detail pane is never empty on first load.
12. As a mock author, I want the currently selected row highlighted, so that I always know which expectation the detail describes.
13. As a mock author, I want the detail header to show the group crumb, the expectation name, its activation, delay and priority, so that I can read the configuration summary.
14. As a mock author, I want a Description card in the detail pane, so that I can read the full description.
15. As a mock author, I want a Matchers card listing every matcher as typed chips, so that I can read the match conditions.
16. As a mock author, I want an Action card showing the action type and its configuration, so that I can read what the mock will return or forward.
17. As a mock author, I want a Timing & state card, so that I can read delay, priority, group and active state together.
18. As a mock author, I want to filter the list by name, description, matcher text or group, so that I can find an expectation quickly.
19. As a mock author, I want a clear "No matches" state when a search yields nothing, so that an empty result is not mistaken for a loading failure.
20. As a mock author, I want clear empty states for no expectations, no matchers and no action, so that the UI never looks broken.
21. As a mock author, I want inactive expectations and members of inactive groups to be de-emphasised, so that I can see what will not match.
22. As a mock author, I want to collapse and expand groups, so that I can focus on one group at a time.
23. As a mock author upgrading an existing project, I want expectations that predate this change (no stored description) to render correctly, so that upgrading changes nothing I can break.
24. As a mock author, I want the Expectation page to be read-only in this step, so that the redesign can ship incrementally without risking my data.
25. As a mock author, I want the add-expectation / add-group / import controls hidden rather than present-but-broken, so that I am not misled into thinking they work.
26. As a mock author, I want activation switches shown but disabled, so that I can still read activation state.
27. As a mock author, I want no group kebab menu when there are no group actions in this step, so that I am not offered a dead control.
28. As a LiveMock user, I want the new app bar brand and layout, so that the product matches the redesign.
29. As a LiveMock user, I want to switch projects from the app bar, so that I can change the active project.
30. As a LiveMock user, I want the project dropdown to show each project's status and port, so that I know which listeners are running.
31. As a LiveMock user, I want start/stop controls in the app bar, so that I can control the mock listener for the current project.
32. As a LiveMock user, I want a running status indicator, so that I can see the listener state at a glance.
33. As a LiveMock user, I want Expectation / Request Log tabs in the app bar, so that I can move between the two main pages.
34. As a LiveMock user, I want the Request Log page to keep working (with its current content) inside the new shell, so that this step does not regress it.
35. As a LiveMock user, I want the Config page to remain reachable, so that configuration is not lost during the redesign.
36. As a LiveMock user, I want Logout and the app version tucked into an overflow menu, so that the app bar stays as clean as the design.
37. As a LiveMock user, I want the app to use the design's dark theme, so that it matches the redesign.
38. As a LiveMock user, I want the now-meaningless theme toggle removed, so that I am not shown a control that no longer does anything visible.
39. As a keyboard user, I want visible focus states and standard focusable controls, so that I can navigate the new UI without a mouse.
40. As a LiveMock user on a narrow window, I want the master and detail panes to stack, so that the page stays usable.
41. As a developer, I want the design tokens exposed as shared CSS custom properties, so that the new components and antd surfaces can reuse one palette.
42. As a mock author, I want a description I set to survive a save, so that the new field is not silently dropped by the existing create/update path.
43. As an existing user, I want no database migration or backfill to be required, so that deploying this step is safe.
44. As a desktop user, I want the desktop app to remain unchanged in this step, so that the web redesign can be validated before it is mirrored.

## Implementation Decisions

### Scope

- This step touches the **web dashboard only**. The Electron desktop renderer and main process are left untouched; the desktop flavor is ported in a later step.
- Only the app shell and the Expectation page are re-skinned. The Request Log and Config pages keep their current content and behaviour; they simply render inside the new shell.

### Domain model

- `ExpectationM` (the single shared core type) gains a `description: string`. `createExpectation()` initialises it to `""`. `duplicateExpectation()` already deep-clones, so it carries the field with no extra work.
- Persistence needs no special handling: the expectation create/update endpoints already insert/`Object.assign` the whole object, and list/detail responses serialise the whole document, so `description` flows through automatically once the type exists.
- **No migration or backfill.** Records written before this change simply have `description === undefined`; the UI must read it defensively (treat missing as `""`) rather than assume it exists.
- **Import builders, the batch-import overwrite copy, and a description-carrying import are out of this step** and are deliberately not implemented now.

### App shell

- The layout becomes a single vertical stack: a fixed-height top app bar and a content region that fills the remainder. The previous left navigation and its collapse behaviour are no longer rendered.
- The app bar contains, left to right: the brand (product logo + wordmark), a divider, the current project dropdown, a page tab group, a spacer, the mock-listener status with a start/stop control, and an overflow menu.
- The project dropdown keeps the existing project-switching logic and shows, per project, the name plus its status/port. "Create New Project" remains available. No new aggregate data (group/expectation counts) is fetched for the app bar.
- The page tabs switch between the Expectation page and the Request Log page through routing. The previous three-way navigation (Expectation / Request Log / Config) becomes two visible tabs; **the Config page has no visible entry in this step** and is reachable by URL only.
- The overflow menu holds Logout and the app version.
- The start/stop control reuses the existing project start/stop requests and the four existing project states (started, stopped, starting, closing), mapping starting/closing to a loading presentation. A running project shows a status indicator and a stop control; a stopped project offers start.

### Theming

- The app is **forced to dark** because the design delivers only a dark theme. The existing theme-toggle UI is removed from the shell. The theme mode slice and its `setMode` action are **kept in code** (not rendered) so a future light theme can be reintroduced; no cleanup in this step.
- The design tokens (background/surface/border/text/accent/state colours, radii, fonts) become **global CSS custom properties** (alongside the existing global variables) rather than being hard-coded per component, so the new components and any antd surfaces can share one palette.
- Fonts: the design specifies Fira Sans (UI) and Fira Code (mono). These are **self-hosted** — the font files are bundled with the frontend and served from its own static assets, referenced from the global token layer. No external Google Fonts request is made, so the dashboard works offline and without third-party calls.

### Expectation page (read-only)

- The page fetches expectations and groups through the existing queries and keeps them in the existing renderer state; no new data source is introduced. Because matchers and actions are embedded in each expectation, the detail pane needs no extra fetch.
- The list is built with the **existing shared match-order helper**, so the displayed order equals the match order: groups ordered by group priority then creation time, members ordered by member priority then creation time, and ungrouped expectations as singletons on the same scale. Groups are expanded by default and can be collapsed.
- The master list renders group headers (name, member count, priority, activation) and expectation rows (state dot, name, description line, delay tag, action-type badge). Inactive expectations, and members of inactive groups, are de-emphasised. The selected row is highlighted.
- The detail pane renders the selected expectation: breadcrumb (group / Expectation), title with activation and delay/priority summary, then cards for **Description**, **Matchers** (typed chips), **Action**, and **Timing & state** (delay, priority, group, active).
- **Only the first action is displayed.** The data model is an array (`actions[]`) and stays an array so future multi-action support can be added; the list badge and the Action card both use the first action. Zero actions shows a muted "no action" state and no badge.
- Search is a **client-side filter** over name, description, group name and matcher text; it performs no writes.
- Selection is in-memory only: the first expectation is selected on load, the selection is kept across refetches when the id still exists, and it is not persisted to the URL or storage in this step.
- **Editing is frozen**: add-expectation, add-group, import, inline editing, matcher/action add-edit-delete, duplicate and delete are not rendered. Activation switches are rendered disabled (state visible, not actionable); the group kebab menu is omitted.
- The **existing editor components and column components are kept in the codebase but no longer referenced** by the page, so later steps can reuse them.

### Component structure and styling

- New read-only presentation is built as **CSS Modules** (`*.module.scss`), consistent with the repo's existing styling convention; no CSS-in-JS or utility framework is introduced.
- Read-only matcher and action presentation is **new code**, not a reuse of the existing editor components (which carry inputs, dropdown menus and delete buttons). The existing editor components remain available for the editing steps.
- The design's responsive behaviour (master/detail stacking below a breakpoint, reduced-motion handling) is preserved.
- Empty states are explicit: no expectations; search with no matches; zero matchers; zero actions. The detail pane's "select an expectation" state only appears when the list itself is empty.

## Testing Decisions

- A good test exercises externally observable behaviour through the **highest existing seam** and asserts outcomes, never internal structures or call counts.
- **No new automated tests are added in this step.** The only non-UI change is the `description` field, which is a pass-through of the already-tested generic expectation create/update/list path; everything else is presentation. There is no frontend or desktop test harness in this repo today.
- The single real seam for the new field is the backend expectation-controller integration suite (supertest against the mounted router). A round-trip assertion that `description` survives create → list → update → get is deliberately **deferred** to the editing step that first writes a description from the UI; it is not needed to ship a read-only display.
- **Manual verification** covers the UI: shell (brand, project switch, start/stop, tabs, overflow menu), the Expectation page (grouping/order, selection, detail, search, empty states, de-emphasis, disabled controls), legacy records without a description, and that Request Log / Config still render inside the new shell.
- Prior art: `backEnd/test/controller/expectationController.test.ts` (supertest against mounted routers) and the sibling controller suites.

## Out of Scope

- **All expectation editing**: create, rename, activate/deactivate, set delay/priority, assign to a group, delete, duplicate.
- **Matcher and action editing**, including add/remove and the editor dropdowns.
- **Import** of any kind, and teaching the import builders or the batch-import overwrite path about `description`.
- **Data migration / backfill** of `description` for existing records.
- **Light theme**, and any redesign of the theme-toggle behaviour beyond removing the control.
- **Request Log page redesign** and **Config page redesign**; both keep their current content (Config is URL-only).
- **Global navigation / account surfaces** beyond the app-bar overflow menu.
- **The desktop (Electron) flavor**, both main process and renderer.
- **Multi-action presentation** — only the first action is shown; the array is kept for the future.
- **Automated frontend / renderer tests.**

## Further Notes

- Fonts are **self-hosted** (confirmed): bundle Fira Sans / Fira Code with the frontend rather than fetching from Google Fonts. Only the weights the design actually uses need to be included.
- No automated tests are added in this step (confirmed); the `description` round-trip assertion is deferred to the editing step.
- The design demo is deliberately tokenised; re-derive component styles from `new-ui/index.html` and the persisted design system rather than inventing values.
- The `description` field is added to the shared core type, so rebuilding the core workspace is required before the frontend consumes it (per `AGENTS.md`).
- The old editor/column components are intentionally left unreferenced rather than deleted, to be revived in the editing steps.
- Tracker convention: this spec lives at `.scratch/new-ui-expectation/spec.md`; implementation tickets go to `.scratch/new-ui-expectation/issues/NN-<slug>.md`.
