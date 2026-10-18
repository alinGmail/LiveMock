# Matchers and Timing & state editing (new UI — step 4)

**Status:** ready-for-agent

> Source of truth: the design's detail config view (`new-ui/index.html`, `configView` ~608–625)
> plus the pre-redesign editors in `../LiveMock/frontEnd/src`. Builds on the redesigned
> Expectation page and the action/description editors. Branch: `new-ui-expectation`.

## Problem Statement

The redesigned Expectation detail is still read-only for two of its four cards: **Matchers** and **Timing & state**. A mock author can change the action and description, but cannot change *what* a request must look like to match (matchers) or *how* the match behaves and ranks (delay, priority, group, active). The existing matcher editing components and redux/REST plumbing are present in the tree but orphaned and no longer rendered. This step makes both cards editable.

## Solution

Give each card an **edit button** that opens a focused **edit panel** (modal) where its values are edited inline, with Cancel and Save:

- **Matchers panel** — an inline matcher list editor (type, condition, name, value, delete) plus "Add matcher". It edits a draft; Save persists the whole matcher array in one request.
- **Timing & state panel** — delay, priority, group and active as a draft; Save persists them in one request.
- The detail header's **Active switch** also becomes interactive (toggles immediately), independent of the panel.

This is web-only; the shared core model and backend are unchanged. Saving updates renderer state, and the list re-derives match order automatically (no refetch).

## User Stories

1. As a mock author, I want an edit button on the Matchers card, so that I can change how a request must match.
2. As a mock author, I want the Matchers button to open a panel, so that I can edit all matchers in one place.
3. As a mock author, I want to add a matcher, so that an expectation can require an additional condition.
4. As a mock author, I want a new matcher to start as a path matcher, so that the common case is one step.
5. As a mock author, I want to choose a matcher's type (method/path/header/query/param), so that I can match the right part of the request.
6. As a mock author, I want switching a matcher's type to reset it to that type's defaults, so that the fields always match the chosen type.
7. As a mock author, I want to choose a matcher's condition, so that I can express is / contains / starts-with / regex / glob and negative variants.
8. As a mock author, I want a name field for header/query/param matchers, so that I can target a specific key.
9. As a mock author, I want the value field to be hidden for presence checks (showed / not showed), so that I am not asked for a value that does not apply.
10. As a mock author, I want to delete a matcher, so that it stops being required.
11. As a mock author, I want deleting a matcher to be immediate (no confirmation), so that editing a list stays quick.
12. As a mock author, I want the matchers panel to show a clear empty state, so that I know there are no conditions.
13. As a mock author, I want Cancel, X, Esc and a backdrop click to discard my matcher edits, so that I can back out safely.
14. As a mock author, I want Save to persist all matcher changes together, so that I do not issue a request per keystroke.
15. As a mock author, I want an edit button on the Timing & state card, so that I can change delay, priority, group and active.
16. As a mock author, I want to set the delay, so that I can simulate slow responses.
17. As a mock author, I want to set the priority, so that I can control which expectation matches first.
18. As a mock author, I want to choose the expectation's group, so that I can organise and rank it.
19. As a mock author, I want to toggle active inside the panel, so that I can enable or disable the match.
20. As a mock author, I want a delay/priority that is empty or invalid to become 0 and never negative, so that I cannot enter nonsense.
21. As a mock author, I want Cancel to discard timing edits, so that I can back out.
22. As a mock author, I want Save to persist all timing changes in one request, so that the update is atomic.
23. As a mock author, I want the detail header's Active switch to actually toggle, so that I can enable or disable the match from the header too.
24. As a mock author, I want the header switch to apply immediately, so that it feels like a switch, not a form.
25. As a mock author, I want saved changes reflected immediately in the detail and list, so that I can see the result.
26. As a mock author, I want a clear error if saving fails, with the panel staying open and my edits preserved, so that I do not lose work.
27. As a mock author, I want Save disabled while the request is in flight, so that I cannot submit twice.
28. As a mock author, I want the matcher changes to affect match order where relevant and the list to update, so that what I see matches the engine.
29. As a keyboard user, I want the panel to trap focus and return focus to the button on close, so that I can operate it without a mouse.
30. As a maintainer, I want the orphaned pre-redesign matcher components and plumbing removed, so that there is one implementation.
31. As a desktop user, I want the desktop app unchanged in this step, so that the web increment can be validated first.

## Implementation Decisions

### Entry points and panels

- Each card header (Matchers, Timing & state) gains an edit (pencil) button, like the Description and Action cards.
- Each opens its own modal panel built on the shared modal primitive (portal, Esc/backdrop/X/Cancel close, focus trap, focus restore). The Matchers panel is wider than the Timing panel.
- Both panels operate on a **deep-copied draft** taken on open. Cancel, X, Esc and a backdrop click discard it.

### Matchers panel

- Renders every matcher as one inline row:
  - **type** — a themed select over method / path / header / query / param; switching type replaces the matcher with a fresh default for that type **keeping the same matcher id**.
  - **condition** — a themed select over all `MatcherCondition` values (not filtered by type).
  - **name** — a text input shown only when the matcher has a name (header / query / param).
  - **value** — a text input shown only when the matcher has a value (i.e. not for showed / not showed).
  - **delete** — an icon button, immediate and without confirmation.
- **Add matcher** appends a default path matcher to the draft. An empty list shows a "no matchers" state plus the Add control.
- **Save** sends one expectation update carrying the whole `matchers` array (wholesale replace). This is functionally identical to the per-matcher create/update/delete endpoints (which only push/filter/assign and save) but atomic and single-request.
- On success, update renderer state and close. On failure, toast, keep the panel open with the draft, re-enable Save. Save is disabled while in flight.

### Timing & state panel

- Fields: **delay** (number, minimum 0, invalid/empty becomes 0), **priority** (same), **group** (themed select of ungrouped + the project's groups), **active** (toggle).
- **Save** sends one expectation update with `{ delay, priority, groupId, activate }`; success updates renderer state and closes; failure toasts and keeps the panel; Save disabled in flight.

### Header Active switch

- The detail header's activation switch becomes interactive and toggles immediately (outside the panels): update the renderer state optimistically and issue the expectation update for `activate`. On failure, surface an error and revert.

### State and ordering

- Matcher and timing saves update the renderer's expectation list only; the list's match order is derived (`buildMatchOrderBlocks`) and recomputes automatically, so no refetch is needed.
- Group select options come from the project's groups already loaded by the page.

### Cleanup

- Remove the now-superseded pre-redesign matcher UI and plumbing that nothing else uses: the inline matcher item component, the matcher type selector, the matcher context, the frontend matcher server module, and the matcher slice (and its wiring into the expectation slice). The shared inline input (`NInput`) is retained because the log filter still uses it.

### Styling

- Design tokens and CSS modules, consistent with the rest of the page; themed antd components (Select) and the shared button styles. Dark only.

## Testing Decisions

- A good test exercises externally observable behaviour through the highest existing seam.
- **No new automated tests.** Persisting matchers and timing goes through the already-tested expectation create/update path; the removed matcher endpoints are not touched. There is no frontend test harness.
- **Manual verification via the Chrome DevTools MCP** covers: opening/closing each panel; editing and saving matchers (add/delete, type switch reset, condition, name/value visibility); editing and saving timing (delay/priority bounds, group, active); the header Active switch toggling immediately; error handling; focus trap and focus return.

## Out of Scope

- Condition options filtered per matcher type.
- Any change to the shared core model, the backend, or the desktop flavor.
- Matcher or timing history/undo.
- Light theme.
- Automated frontend tests.

## Further Notes

- Design references: `new-ui/index.html` `configView` / `matcherChip` (~569–625) and the pre-redesign editors in `../LiveMock/frontEnd/src/component/matcher/` and `.../expectation/listColumnCompoment.tsx`.
- The matcher condition set comes from the shared `MatcherCondition` enum; presence conditions (showed / not showed) hide the value field, and header/query/param matchers show the name field.
- Tracker convention: this spec lives at `.scratch/new-ui-matchers-timing/spec.md`; implementation tickets go to `.scratch/new-ui-matchers-timing/issues/NN-<slug>.md`.
