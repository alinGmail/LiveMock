# Add Expectation (new UI — step 2)

**Status:** ready-for-agent

> Source of truth: the add-expectation dialog in `new-ui/index.html` (lines ~753–800) and
> `new-ui/design-notes.md` (line 40). Builds on the read-only Expectation page from
> `.scratch/new-ui-expectation/spec.md`. Branch / worktree: `new-ui-expectation`.

## Problem Statement

The redesigned Expectation page is deliberately read-only, so a mock author cannot create a new expectation from it. The design already specifies how creation should work — an **Add Expectation** dialog — but the page does not render the button and there is no way to create a row. To be useful at all, the redesign needs at least the first write path: adding an expectation.

## Solution

Wire the design's **Add Expectation** dialog to the existing create endpoint.

A primary **Add Expectation** button sits in a toolbar at the top of the list pane. It opens a modal with three fields — **Name**, **Description** (optional) and **Group** — plus Cancel / Create. Create builds a new expectation (name, description, group, and a default custom-response action) and posts it; on success the list is refetched, the new expectation is selected, and any active search is cleared so the new row is visible. Failure is surfaced with the existing toast. The dialog closes on Cancel, the X, Esc, or a backdrop click; keyboard focus is trapped while open and returns to the Add button on close.

This is the only write path added in this step. Editing an existing expectation (name, description, matchers, action, timing), Add group, and Import remain out of scope, as does the desktop flavor.

## User Stories

1. As a mock author, I want an Add Expectation button on the Expectation page, so that I can create an expectation without leaving the page.
2. As a mock author, I want the button to open a dialog, so that I can set the basics before the row exists.
3. As a mock author, I want to type a name, so that the new expectation is identifiable in the list.
4. As a mock author, I want the name field focused when the dialog opens, so that I can start typing immediately.
5. As a mock author, I want an optional description field, so that I can document what the mock does.
6. As a mock author, I want to choose a group or leave the expectation ungrouped, so that the new row lands where it belongs.
7. As a mock author, I want the group list in the dialog to reflect the current project's groups, so that I can pick the right one.
8. As a mock author, I want Create to produce an expectation with a sensible default response, so that the new mock is immediately usable.
9. As a mock author, I want a sensible fallback name when I leave the name blank, so that I never create an unnamed row.
10. As a mock author, I want the newly created expectation selected after creation, so that its detail is shown right away.
11. As a mock author with a search filter active, I want the filter cleared after creation, so that the new expectation is visible.
12. As a mock author, I want the list to refresh after creation, so that ordering, groups and counts are correct.
13. As a mock author, I want to cancel the dialog without creating anything, so that I can back out safely.
14. As a mock author, I want Esc, a backdrop click or the X to close the dialog, so that closing is quick.
15. As a keyboard user, I want focus trapped inside the dialog while it is open and returned to the Add button when it closes, so that I can operate it without a mouse.
16. As a mock author, I want a clear error message when creation fails, so that I know the row was not created.
17. As a mock author, I want the Create button disabled while the request is in flight, so that I cannot submit twice.
18. As a mock author, I want the new row to show its default action badge, so that the list reads consistently with other rows.
19. As a mock author, I want the detail of a new expectation to show an empty matcher list and its default action, so that I understand what was created.
20. As a mock author, I want a description I typed to persist and appear in the row and detail, so that the new field is honoured.
21. As a mock author creating an expectation inside a group, I want it to appear under that group in match order, so that grouping works.
22. As a mock author creating an ungrouped expectation, I want it in the Ungrouped section, so that it is where I expect.
23. As a LiveMock user, I want the dialog to match the redesign's dark modal styling, so that the experience is consistent.
24. As a keyboard user, I want the Add button to be focusable and labelled, so that I can reach it by keyboard.
25. As a mock author, I want only Add Expectation added in this step, so that the increment stays small and safe.
26. As a desktop user, I want the desktop app unchanged in this step, so that the web increment can be validated first.

## Implementation Decisions

### Scope

- The web dashboard only. The Electron desktop renderer and main process are untouched.
- Only **Add Expectation**. Add group, Import, and all editing of an existing expectation (name, description, activate, priority, delay, group, matchers, actions, delete, duplicate) remain out of scope.
- No change to the shared core model and no change to the backend: the existing create endpoint already accepts a full expectation.

### Entry point

- A toolbar is added at the top of the master (list) pane, above the search field, matching the design's order.
- The toolbar contains a single **primary** button labelled "Add Expectation" with a plus icon. The design's Add-group and Import buttons are not rendered.

### The dialog

- A purpose-built `AddExpectationModal` component, styled with its own CSS module to match the design's small modal. No general-purpose modal primitive is extracted in this step.
- Rendered through a React portal onto `document.body`.
- Fields, in order: **Name** (text input), **Description** (textarea, optional, placeholder "What does this expectation do?"), **Group** (a native `select` styled to match the design, listing "ungrouped" plus the current project's groups).
- Footer: **Cancel** (secondary/ghost) and **Create** (primary). A close X in the header.
- The Name input is focused when the dialog opens.
- The dialog closes on Cancel, the X, the Esc key, or a click on the backdrop; none of these create anything.
- While open, keyboard focus is trapped within the dialog; on close, focus returns to the Add button.
- Background scroll is not locked (the page is already a fixed-height layout).
- Enter does not submit; only the Create button creates. Enter inside the description textarea inserts a newline.

### Creating

- Create builds the expectation from the core factory and then applies the dialog values:
  - `name`: the trimmed input, or the literal fallback `"New expectation"` when empty after trimming.
  - `description`: the trimmed input (may be empty).
  - `groupId`: the selected group id, or `null` for ungrouped.
  - `actions`: a single factory default custom-response action (status 200, JSON content type, empty body, no headers).
  - All other fields keep the factory defaults (`activate: true`, `priority: 0`, `delay: 0`, `matchers: []`).
- The expectation is posted through the existing create request for the current project.
- On success: refetch the expectation list, select the new expectation, and clear the active search.
- On failure: surface the error with the existing toast helper and leave the dialog open.
- The Create button is disabled while the request is in flight.

### Styling

- The dialog and the toolbar use the redesign tokens (already global) and CSS modules, consistent with the rest of the page. Dark only, as in the previous step.

## Testing Decisions

- A good test exercises externally observable behaviour through the highest existing seam and asserts outcomes.
- **No new automated tests.** The only new behaviour is a call to the already-tested expectation create endpoint with dialog-derived values; the request/response path is covered by the existing backend controller suite. There is no frontend test harness in this repo today.
- Manual verification covers: opening/closing the dialog (Cancel/X/Esc/backdrop), keyboard focus trap and focus return, creating with a name, with a blank name (fallback), with a description, in a group and ungrouped, the clear-search behaviour, the new row's badge/detail, and the failure toast.

## Out of Scope

- Editing an existing expectation (name, description, activate, priority, delay, group assignment, delete, duplicate).
- Matcher and action editors.
- Add group and Import.
- Any change to the shared core model, the backend, or the desktop flavor.
- Light theme.
- Automated frontend tests.
- A reusable modal primitive.

## Further Notes

- Design references: the add dialog markup/handlers in `new-ui/index.html` (~753–800) and the component inventory in `new-ui/design-notes.md` (line 40).
- The design injects a default custom-response action on create; this spec keeps that behaviour but with the core factory's default body/headers (empty body, no headers) rather than the demo's placeholder.
- The dialog reads the current project's groups from the same group data the list already fetches; no new data source.
- Tracker convention: this spec lives at `.scratch/new-ui-add-expectation/spec.md`; implementation tickets go to `.scratch/new-ui-add-expectation/issues/NN-<slug>.md`.
