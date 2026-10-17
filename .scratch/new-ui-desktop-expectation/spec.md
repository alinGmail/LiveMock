# New UI — Desktop Expectation Page

**Status:** ready-for-agent

> Source of truth: the already-shipped web redesign (`frontEnd/src`) and the static design
> reference under `new-ui/` (`DESIGN.md`, `design-notes.md`, `index.html`).
> Branch / worktree: `desktop-new-ui` in `feature-new-ui-desktop`.

## Problem Statement

LiveMock ships two flavours of the same product: a web dashboard and an Electron desktop
app. The web dashboard has been migrated to the new dark master–detail design, but the
desktop renderer still shows the old UI: a 70px project strip, a collapsible left
navigation, and a flat, fully-editable antd table on the Expectation page. Desktop users
therefore get a different product from web users. They cannot scan expectations by
description, cannot inspect matchers, actions and timing in a detail pane, and cannot use
the grouped, searchable list that the redesign introduced.

The desktop data layer is not the problem. Its IPC handlers already support everything
the redesigned page needs: expectation descriptions, group priority and activation,
whole-array matcher updates, timing and state updates, and action create/update/delete.
The gap is the renderer: the new tokens, shell, primitives, page and edit dialogs exist
only in the web tree.

The desktop app also has desktop-only concerns that must survive the port: native window
chrome and application menu, IPC instead of HTTP, project creation and configuration,
the first-run welcome flow, the Request Log page and its live IPC events, the detached
request-log detail window, and the “Mock this request” dialog that creates expectations
from captured traffic.

## Solution

Port the web redesign to the Electron desktop renderer, starting with the Expectation
page.

- **Foundation**: adopt the redesign’s dark tokens, self-hosted Fira Sans / Fira Code
  fonts, global focus and scrollbar styling, and the shared primitives the redesign
  introduced (modal, toggle, select, button styles, Monaco dark theme).
- **Shell**: replace the project strip and left navigation with the redesign’s single top
  app bar and a full-height content region. Adapt the app bar to desktop: no account or
  auth menu, project switcher with status and port, Expectation / Request Log tabs,
  project settings gear, mock-listener status and start/stop. “New project” keeps the
  existing project editor dialog. The gear opens the existing Config page. Config is no
  longer a visible tab.
- **Expectation page**: replace the editable table with the redesign’s master–detail
  page — a searchable, grouped list ordered like the match engine on the left, and a
  detail pane with description, matchers, action and timing & state on the right. Add,
  name, description, group, matcher, timing/state and action editing are restored through
  the redesign’s dialogs, wired to the existing desktop IPC layer.
- **Desktop behaviour**: force the redesign’s dark theme, remove the now-meaningless
  light/dark toggle, and give the main window a desktop-appropriate default and minimum
  size.
- **Strict web parity**: the desktop Expectation page matches the current web
  implementation, including its deliberate omissions. Import, duplicate/delete
  expectation, delete group, and multi-action editing are not ported; the old controls
  and dialogs for them are removed rather than left as dead UI. These are accepted
  regressions for this step.
- **Everything else stays**: Request Log and Config keep their current content under the
  new shell, and the first-run welcome page keeps its current content outside the shell.
  The Request Log’s “Mock this request” dialog is not redesigned. The native Electron
  menu, About window and detached request-log detail window are untouched.

The result is a desktop app whose shell and Expectation page match the web product, while
the remaining pages continue to work and can be migrated in later steps.

## User Stories

1. As a desktop user, I want the desktop app to use the same dark redesign as the web
   dashboard, so that the product feels consistent across flavours.
2. As a desktop user, I want the redesign’s typography (Fira Sans for UI, Fira Code for
   values and code), so that the desktop app matches the design specification.
3. As a desktop user, I want the fonts bundled with the app, so that the interface works
   offline and makes no third-party font requests.
4. As a desktop user, I want a single top app bar instead of a project strip plus left
   navigation, so that navigation matches the approved design.
5. As a desktop user, I want the app bar to show the LiveMock brand, so that the app has
   a clear identity.
6. As a desktop user, I want a project dropdown in the app bar, so that I can switch
   between projects without leaving the page.
7. As a desktop user, I want each project entry to show its running state and port, so
   that I know which mock listener is active before switching.
8. As a desktop user, I want a “New project” entry in the project dropdown, so that I can
   create another project without restarting the app.
9. As a desktop user, I want the new-project dialog to keep the existing project fields,
   so that creating a project behaves as it does today.
10. As a desktop user, I want Expectation and Request Log tabs in the app bar, so that I
    can move between the two main pages.
11. As a desktop user, I want the active page tab highlighted, so that I always know
    where I am.
12. As a desktop user, I want a project settings gear in the app bar, so that I can reach
    the existing Config page.
13. As a desktop user, I want Config to remain reachable but not occupy a page tab, so
    that the navigation matches the two-tab design without losing configuration.
14. As a desktop user, I want a status pill for the current project, so that I can see
    whether the mock listener is running, stopped, starting or stopping.
15. As a desktop user, I want a start/stop control in the app bar, so that I can control
    the current project’s mock listener.
16. As a desktop user, I want the app bar to omit account, sign-in and sign-out controls,
    so that the desktop app does not pretend to have an account system it does not have.
17. As a desktop user, I want the native Electron application menu to keep working, so
    that reload, full screen, minimize, About and the other existing shortcuts remain
    available.
18. As a desktop user, I want About to remain available from the native menu, so that
    version information is not lost when the app bar user menu is removed.
19. As a desktop user, I want the main window to open at a size that fits the
    master–detail layout, so that I can see the list and the detail pane side by side.
20. As a desktop user, I want the window to enforce a sensible minimum size, so that the
    layout does not collapse into an unusable state.
21. As a desktop user on a narrow window, I want the master and detail panes to stack, so
    that the page remains usable when the window is small.
22. As a desktop user, I want the app to be dark-only in this step, so that I get the
    design that actually exists rather than a broken light variant.
23. As a desktop user, I want the old light/dark toggle removed, so that I am not offered
    a control that no longer changes the app.
24. As a desktop user, I want the Expectation page to show a grouped list ordered like the
    mock match engine, so that I can see which expectation will win.
25. As a desktop user, I want groups to show their name, member count, priority and
    activation state, so that I can read a group at a glance.
26. As a desktop user, I want ungrouped expectations collected in an “Ungrouped” section,
    so that they remain visible and ordered with everything else.
27. As a desktop user, I want to collapse and expand groups, so that I can focus on one
    group at a time.
28. As a desktop user, I want each expectation row to show its name, description, delay
    and action type, so that I can scan the list quickly.
29. As a desktop user, I want inactive expectations and members of inactive groups
    de-emphasised, so that I can see what will not match.
30. As a desktop user, I want to select a row and see its details on the right, so that I
    can inspect one expectation without losing the list.
31. As a desktop user, I want the first expectation selected by default, so that the
    detail pane is populated on first load.
32. As a desktop user, I want the selected row highlighted, so that I always know which
    expectation the detail describes.
33. As a desktop user, I want to search by name, description, group or matcher text, so
    that I can find an expectation quickly.
34. As a desktop user, I want a clear “No matches” state when a search finds nothing, so
    that I do not mistake an empty result for a loading failure.
35. As a desktop user, I want a clear empty state when the project has no expectations,
    so that the page does not look broken.
36. As a desktop user, I want the detail pane to show a breadcrumb, the expectation name,
    its group, activation, delay and priority, so that I can read the configuration
    summary.
37. As a desktop user, I want a Description card, so that the author’s explanation of the
    mock is visible.
38. As a desktop user, I want matchers rendered as typed chips, so that I can read the
    match conditions without opening an editor.
39. As a desktop user, I want an Action card showing the first action’s type and
    configuration, so that I can see what the mock returns or forwards.
40. As a desktop user, I want a Timing & state card, so that I can read delay, priority,
    group membership and active state together.
41. As a desktop user, I want to add an expectation from the new page, so that I can
    create mocks without going back to the old table.
42. As a desktop user, I want the Add Expectation dialog to ask for a name, an optional
    description and a group, so that new expectations start with useful context.
43. As a desktop user, I want a new expectation to start with a default custom-response
    action, so that it is editable immediately.
44. As a desktop user, I want the newly created expectation selected after the list
    refreshes, so that I can continue editing it without searching.
45. As a desktop user, I want to edit an expectation’s name from the detail header, so
    that I can rename it in place.
46. As a desktop user, I want to edit an expectation’s description in a dialog, so that I
    can document the mock.
47. As a desktop user, I want to edit delay, priority, group and active state together, so
    that timing and state stay consistent.
48. As a desktop user, I want an active toggle on the detail header, so that I can
    quickly enable or disable an expectation.
49. As a desktop user, I want activation changes to apply optimistically, so that the UI
    responds immediately.
50. As a desktop user, I want to create and edit groups, including name, priority and
    active state, so that I can keep expectations organised and ordered.
51. As a desktop user, I want to toggle a group’s active state from its header, so that I
    can enable or disable a whole group quickly.
52. As a desktop user, I want to add, edit and remove matchers in a dialog, so that I can
    change which requests the mock matches.
53. As a desktop user, I want matcher type, condition, name and value controls to follow
    the matcher model, so that I cannot create invalid combinations.
54. As a desktop user, I want to edit the first action in the redesign’s action dialog, so
    that I can change response status, body, headers, proxy target or static directory.
55. As a desktop user, I want to delete the first action with a confirmation, so that I
    can remove a mock response safely.
56. As a desktop user, I want to add a custom-response action when the expectation has
    none, so that I can rebuild a response.
57. As a desktop user, I want every save to go through the existing desktop IPC layer, so
    that the app keeps working without an HTTP server.
58. As a desktop user, I want saves to update the Redux state immediately, so that the
    list and detail reflect the change without a full reload.
59. As a desktop user, I want failures to show a toast, so that I know a save did not
    happen.
60. As a desktop user, I want to keep using the Request Log page under the new shell, so
    that the redesign does not regress log inspection.
61. As a desktop user, I want “Mock this request” on the Request Log page to keep creating
    expectations, so that the main creation path from captured traffic still works.
62. As a desktop user, I want the detached request-log detail window to keep opening, so
    that multi-window inspection is not lost.
63. As a desktop user, I want the Config page to keep working under the new shell, so that
    I can still edit project settings and delete a project.
64. As a desktop user, I want the first-run welcome page to keep working when there are no
    projects, so that a fresh install can create its first project.
65. As a desktop user with existing data, I want expectations without a stored description
    to render correctly, so that upgrading does not break old mocks.
66. As a desktop user, I want no database migration, so that opening the app after the
    update is safe.
67. As a keyboard user, I want visible focus rings and standard focusable controls, so
    that I can use the new UI without a mouse.
68. As a keyboard user, I want dialogs to close on Escape and restore focus, so that
    editing feels predictable.
69. As a desktop user, I want the old expectation table and its inline editors gone, so
    that I am not presented with two competing interaction models.
70. As a developer, I want the old expectation UI code removed once the new page is live,
    so that future changes do not accidentally revive dead components.
71. As a developer, I want the desktop data layer left intact, so that later steps can
    restore Import, delete/duplicate or multi-action without redesigning IPC.
72. As a developer, I want the web and desktop renderers to stay near-copies, so that
    future design changes can be ported predictably.
73. As a maintainer, I want the desktop build, type-check and lint to pass, so that the
    port does not introduce compile-time drift.
74. As a maintainer, I want a manual end-to-end checklist for the desktop app, so that
    shell, expectation, log and config behaviour is verified before release.

## Implementation Decisions

### Scope and sequencing

- This step ports the redesign foundation, the app shell and the Expectation page to the
  **desktop renderer only**. The web renderer, backend, Electron main-process IPC
  handlers and shared core model are not changed.
- The web implementation is the source of truth for layout, component structure,
  interactions and validation. The static design demo is the source for visual tokens and
  any behaviour that the web implementation has not yet ported.
- The desktop renderer remains a near-copy of the web renderer. Components are copied and
  adapted to the desktop’s IPC data layer rather than extracted into a new shared UI
  package in this step.

### Foundation

- The redesign’s global CSS custom properties become part of the desktop renderer’s
  global stylesheet: backgrounds, surfaces, borders, text levels, accents, semantic
  colours, radii, focus ring, spacing, and the sans/mono font stacks.
- Fira Sans and Fira Code are self-hosted through package dependencies and imported at
  renderer startup. No external font request is made.
- The shared modal, toggle, select, button-style and Monaco dark-theme modules are
  copied from web. They remain presentation-only primitives; no data access moves into
  them.
- The app is forced to dark mode: the initial theme mode is dark, the document body gets
  the dark class, the document colour scheme is dark, and the antd provider always uses
  the dark algorithm. The theme-mode slice is kept for a future light theme, but no
  visible toggle is rendered.

### Shell

- The shell becomes a vertical stack: a fixed-height top app bar and a full-height
  content region that scrolls independently. The old project strip and left navigation
  are removed.
- The app bar contains, left to right: brand mark and wordmark, divider, project
  dropdown, Expectation / Request Log tabs, project settings gear, spacer, status pill,
  start/stop control. The web user/account menu is removed.
- The project dropdown reuses the existing project list, selection, status/port display
  and start/stop behaviour. It also offers “New project”, which opens the existing
  project editor dialog in a modal; the desktop has no redesign of project creation in
  this step.
- The project settings gear navigates to the existing Config page. Config keeps its
  current content and behaviour, remains a route, and is removed from the visible tab
  set. The app bar shows no tab as active while Config is open.
- The first-run welcome page remains outside the new shell and is shown whenever the
  project list is empty, preserving the current onboarding behaviour.
- The Electron main window gets a default size of 1280×800 and minimum size of
  960×640. The renderer keeps the web design’s responsive stacking below 900px.
- The native application menu, About window and detached request-log detail window are
  unchanged. The request-log detail route remains outside the shell.

### Expectation page

- The page is a master–detail layout. The left pane renders the grouped list; the right
  pane renders the selected expectation. The list is built with the shared match-order
  helper so that display order equals mock match order.
- The page keeps the web search semantics: a client-side filter over expectation name,
  description, group name and matcher text. Selection is driven by the unfiltered list,
  so filtering the selected row out does not clear the detail pane.
- Group headers show a collapse control, name, member count, priority pill, inactive
  marker, activation toggle and an edit action. The group header’s edit action opens the
  group dialog. Groups are expanded by default.
- Expectation rows show an active-state dot, name, description or “no description”
  placeholder, delay tag, and the first action’s type badge. Inactive expectations and
  members of inactive groups are de-emphasised. The selected row is highlighted.
- The detail pane shows a breadcrumb, name, active toggle, delay/priority chips,
  description, matcher chips, an action summary for the first action, and a timing &
  state grid. It shows a dedicated empty state when the project has no expectations.
- When an expectation has no action, the action card shows a muted empty state and an
  add action control. When it has an action, the card shows edit and delete controls.
- The page reads expectations and groups through the existing desktop IPC wrappers and
  React Query keys. The desktop list wrapper is adapted to the name the copied page
  expects; no new IPC channel is introduced.
- The page dispatches the existing expectation, action and group Redux updates after
  successful saves. Existing error handling and toast infrastructure are reused.

### Editing

- **Add expectation**: name, optional description and group selection. Creating an
  expectation uses the shared factory, assigns the default custom-response action, calls
  the existing create IPC wrapper, closes the dialog, refetches the list and selects the
  new expectation after it appears.
- **Name**: edited through a small modal from the detail header, saved through the
  generic expectation update and applied to Redux.
- **Description**: edited through a modal, saved through the generic expectation update
  and applied to Redux.
- **Timing & state**: delay, priority, group and active state are edited in one modal and
  saved through one generic expectation update.
- **Active toggle**: applies optimistically to Redux, calls the update IPC wrapper, and
  rolls back with a toast on failure.
- **Groups**: create and edit dialogs cover name, priority and active state. Group names
  are validated against the other groups. The group header toggle updates activation
  through the group update wrapper.
- **Matchers**: a dialog edits the whole matcher array (add, remove, type, conditions,
  name and value), then saves it through the generic expectation update. Presence
  conditions hide the value field; name-bearing matcher types show the name field.
- **Action**: the action dialog edits the first action only. It supports the three action
  types (custom response, proxy, static directory), their existing editors, headers,
  body/status/proxy/static fields, and the existing validation. Saving updates the action
  through the action update wrapper and Redux.
- **Action delete/add**: deleting the first action asks for confirmation; adding an action
  is only offered when the expectation has none and creates a default custom-response
  action.
- All dialogs follow the redesign’s modal primitive: centred, Escape/backdrop close,
  focus trap, focus restoration, and explicit Cancel/Save actions.

### Strict web parity and deliberate removals

- The desktop page matches the current web page, not the old desktop table. The following
  existing desktop capabilities are **not** ported in this step:
  - Import of expectations (and the Import dialog).
  - Duplicate expectation.
  - Delete expectation.
  - Delete group (including cascade from the old group column).
  - Inline editing in table columns.
  - Dedicated matcher create/update/delete UI; matcher editing now saves the whole array.
  - Editing or displaying more than the first action.
- The corresponding old UI components become unreachable and are removed after the new
  page is live. Their server wrappers, IPC channels, Redux slices and shared core helpers
  stay in place so future steps can restore the capabilities without data-layer work.
- The Request Log’s existing “Mock this request” dialog is explicitly **not** redesigned
  in this step and keeps its current look and behaviour. It continues to create
  expectations through the existing wrapper.

### Cleanup

- Remove the old Expectation page table, column editors, group column components,
  expectation context, old action and matcher editor trees, and the orphaned Import
  dialog from the desktop renderer once the new page no longer references them.
- Keep the desktop matcher and action IPC wrappers and Redux slices even if the new page
  does not call every one of them.
- Keep the `NInput` primitive because the Request Log filter still uses it. Remove only
  expectation-specific dead UI.
- Do not delete or restyle the Request Log’s Mock-from-Log dialog.

### Data and compatibility

- No change to the shared core model, backend API, IPC channel names, or persisted data.
- Existing expectations without a stored description render with an empty description;
  no migration or backfill is required.
- The page’s data flow stays renderer-local: IPC wrapper → React Query → Redux → page.

## Testing Decisions

- A good test exercises externally observable behaviour through the highest existing
  seam and asserts outcomes, never internal structures or call counts.
- There is no automated renderer test harness in the repository today. This step does not
  add one. The highest practical seam is the running Electron app: launch it, exercise
  the shell and Expectation page, and observe the rendered result and persisted data.
- The data layer is already covered where it matters. No backend or core behaviour is
  changed, so the existing Jest suites remain the regression guard for the shared core
  and backend. They must continue to pass where they are run.
- Static verification for the desktop workspace covers lint, TypeScript compilation of
  the renderer and Electron project, and a production renderer build. These catch the
  most likely port failures: broken imports, missing CSS modules, mismatched server
  wrapper signatures and unresolved shared-core exports.
- Manual verification covers:
  - shell: brand, project switch, new project dialog, tabs, gear → Config, status pill,
    start/stop, no account menu, native menu and About;
  - Expectation page read view: match-order grouping, ungrouped section, collapse,
    selection, search, empty states, inactive de-emphasis, description, matcher chips,
    first-action summary and timing/state;
  - editing: add expectation, select-after-create, name, description, timing/state,
    active toggle, group create/edit/toggle, matcher add/edit/remove, action
    edit/delete/add;
  - compatibility: existing records without a description, Request Log still working,
    “Mock this request” still creating expectations, Config still editing/deleting,
    first-run welcome still creating the first project, detached detail window;
  - window behaviour: default and minimum size, stacking below the responsive
    breakpoint, no horizontal overflow.
- Prior art: the web redesign steps were verified the same way — lint/type/build plus
  manual browser checks — because the repository has no frontend test harness. The
  backend controller suites are the prior art for data-layer assertions, but no new
  data-layer assertion is needed here.

## Out of Scope

- Redesigning the Request Log page, Config page, first-run welcome page or settings page.
- Any authentication or account surface; the desktop app has no account system.
- The Request Log “Mock this request” dialog redesign.
- The detached request-log detail window redesign.
- Import of expectations, including the Import dialog and batch-import UX.
- Duplicate expectation, delete expectation and delete group.
- Multi-action display or editing; only the first action is shown and edited.
- Dedicated matcher create/update/delete UI; matchers are saved as a whole array.
- A light theme, or any theme toggle.
- Changes to the native Electron application menu, About window or window chrome.
- Changes to the shared core model, backend, IPC channel names or database schema.
- Extracting a shared UI package for web and desktop.
- Automated renderer or end-to-end tests.
- Rebuilding the Request Log table, filter bar or column configuration.

## Further Notes

- The web redesign steps deliberately deferred the desktop flavour. This spec is that
  deferred port, scoped to the shell and the Expectation page.
- Strict web parity is a conscious product decision. Desktop users lose Import,
  duplicate/delete, group delete and multi-action editing in this step; those capabilities
  are not silently dropped in code, they are removed from the UI and documented here so a
  later step can restore them intentionally.
- The old pages will look visually inconsistent inside the new dark shell. That is
  accepted for this step; they must remain functional, not redesigned.
- The desktop renderer must keep using `window.api` IPC. Web HTTP modules, superagent,
  socket.io and auth code must not be copied into the desktop renderer.
- The redesign fonts are self-hosted; the desktop app must not fetch fonts from a CDN.
- Work happens on the `desktop-new-ui` branch in the `feature-new-ui-desktop` worktree.
- Tracker convention: this spec lives at
  `.scratch/new-ui-desktop-expectation/spec.md`; implementation tickets go to
  `.scratch/new-ui-desktop-expectation/issues/NN-<slug>.md`.
