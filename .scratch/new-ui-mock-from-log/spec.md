# Mock this request — log-to-expectation dialog (new UI — step 6)

**Status:** ready-for-agent

> Source of truth: the Request Log page and its mock dialog in `new-ui/index.html`
> (~1008–1196) and `new-ui/design-notes.md` (Request Log section, lines 84–85, 98, 112).
> Branch: `new-ui-expectation`. Supersedes the "Mock this request" bullet that
> `.scratch/new-ui-request-log/spec.md` left out of scope (button rendered inert).

## Problem Statement

On the redesigned Request Log page, selecting a request opens an inline detail pane,
but its **Mock this request** button is disabled. So a mock author who sees a real
request they want to fake has to leave the page, open the Expectation page, and
recreate the request by hand — retyping the method, path, query, parameters and the
response the server actually returned. The captured request already contains all of
that information; the page just refuses to use it.

## Solution

Make **Mock this request** open a dialog that is pre-filled from the selected
captured request, so a mock author can turn a real request into a mock in one step:

- A **Name** field, defaulting to `"<method> <path>"`.
- A **Matchers** panel (hint: "Only checked fields are matched") with checkable rows
  for **method**, **path**, **Query** entries and **Request params** entries. Each row
  has a condition select (IS / IS_NOT / CONTAINS / NOT_CONTAINS / START_WITH /
  END_WITH / MATCH_REGEX / …) and a value. Method and path are checked by default;
  query and param rows are listed but unchecked so the author tightens the match
  deliberately.
- A **Response** panel (hint: "always returns JSON") with a status, checkable
  response-header rows, and a JSON body editor that flags invalid JSON.
- A footer with **Reset / Cancel / Save**.

Only the checked rows become matchers. Saving creates a single custom-response
expectation and confirms it with a toast; the author **stays on the Request Log
page**. If the selected request has no request to mock, the button is unavailable.

## User Stories

1. As a mock author, I want to turn a captured request into a mock without leaving the Request Log page, so that I can react to real traffic immediately.
2. As a mock author, I want the mock dialog pre-filled from the captured request, so that I don't retype the method, path, query or parameters.
3. As a mock author, I want the dialog's name pre-filled as `"<method> <path>"`, so that the new expectation is recognisable in the Expectation list.
4. As a mock author, I want the captured response (status, headers, body) pre-filled, so that the mock replays the answer the server actually gave.
5. As a mock author, I want method and path matched by default, so that the obvious identity of the request is mocked without extra clicks.
6. As a mock author, I want query entries and request params listed but unchecked by default, so that I can add them only when they matter.
7. As a mock author, I want each matcher row to have a condition select, so that I can match exactly, by prefix, or by regex.
8. As a mock author, I want to check and uncheck each matcher row, so that only the fields I choose become matchers.
9. As a mock author, I want to edit a row's value before saving, so that I can generalise a concrete path into a pattern.
10. As a mock author, I want a status field in the Response panel, so that the mock returns the status I choose.
11. As a mock author, I want checkable response-header rows, so that I control which headers the mock returns.
12. As a mock author, I want a JSON body editor, so that I can shape the mocked response body.
13. As a mock author, I want invalid JSON flagged before I can save, so that I never create a broken mock.
14. As a mock author, I want the empty body to be accepted and saved as `{}`, so that a request with no captured body still mocks cleanly.
15. As a mock author, I want a Reset button, so that I can undo my edits and start from the captured request again.
16. As a mock author, I want a Cancel button, so that I can close the dialog without creating anything.
17. As a mock author, I want a Save button that shows progress while it works, so that I know the create is in flight.
18. As a mock author, I want a confirmation toast after saving, so that I know the mock was created.
19. As a mock author, I want to stay on the Request Log page after saving, so that I can keep inspecting the stream.
20. As a mock author, I want the newly created expectation reflected in the page's expectation data, so that later matches show its name.
21. As a mock author, I want the button disabled when there is no request to mock, so that I don't create a meaningless empty-method/path mock.
22. As a mock author, I want to be told why the button is unavailable, so that the disabled state is not confusing.
23. As a mock author, I want to create another mock from a request that already matched an expectation, so that I can iterate freely.
24. As a mock author, I want the dialog to work in the dark-only theme, so that it matches the rest of the redesign.
25. As a maintainer, I want the captured-request-to-expectation logic shared with the desktop flavour, so that the two do not drift.
26. As a maintainer, I want the existing, unit-tested conversion helper reused unchanged, so that the feature adds no new core surface.

## Implementation Decisions

### Conversion (reuse, unchanged)

- The dialog reuses the existing shared core helper `livemock-core/import/fromLog`:
  `buildDraftFromLog` (captured `LogM` → editable draft), `buildExpectationFromDraft`
  (checked rows → a complete `ExpectationM`) and `isValidJsonContent`. It is already
  unit-tested and is used by the desktop flavour, so the core module is **not
  modified**.
- Pre-fill defaults are the helper's: method and path checked (path condition `IS`);
  query and param rows listed but unchecked; response status from the capture (or
  `200` when absent); response body pretty-printed as JSON; response headers listed
  with system headers excluded; content-type header pre-checked.
- The created expectation is a single custom-response (JSON) action; `groupId` is
  null, `activate` true, `priority`/`delay` 0.

### Dialog UI (reuse, thin adaptation)

- The dialog is the existing web `MockFromLogModal` component (an `antd` modal titled
  "Mock this request", width 780, `maskClosable=false`), which already renders the
  Name / Matchers / Response panels and the Reset / Cancel / Save footer, uses the
  app's `App.useApp()` toast, and follows the app's dark theme (including the Monaco
  editor theme). It is wired for the first time — it is currently orphaned.
- The design deliberately did **not** restyle this dialog ("the Mock-from-log modal …
  [is] not redesigned"), so it is reused rather than rebuilt with the redesign's
  primitives.
- The one behavioural addition to the component: after building the expectation from
  the draft, set its **description** to `"Mocked from request <method> <path>"`. This
  is done in the web layer only; the core helper stays untouched.

### Entry point and availability

- The detail-pane header's **Mock this request** button becomes active: it loses its
  `disabled` attribute and "Not available yet" title and gains an `onClick` that opens
  the dialog for the currently selected request.
- The button is disabled when the selected request has no request payload
  (`log.req` is null), with a title explaining why (`buildDraftFromLog` tolerates a
  null request but would produce an empty-method/path mock).

### Post-save behaviour

- On successful create the dialog shows a success toast and closes; the page **stays
  on the Request Log**.
- The page refetches its expectation list so the created expectation appears in its
  expectation data (used by the "matched" labels).
- The button remains available for requests that already matched an expectation
  (`log.expectationId` non-null); duplicates are allowed. There is no "already
  mocked" special state.

### Scope

- **Web only.** The desktop flavour already has its own copy of the dialog wired to
  its old log table; it is not touched. The core helper is shared and unchanged.

### Tracker housekeeping

- `.scratch/new-ui-request-log/spec.md` had "Mock this request (button rendered but
  inert)" under Out of Scope; that bullet is updated to point at this step.

## Testing Decisions

- A good test exercises externally observable behaviour through the highest existing
  seam, and asserts on outcomes, not implementation details.
- **The only seam is the existing core conversion seam** (`core/import/fromLog.ts`,
  covered by `backEnd/test/fromLog/fromLog.test.ts`). This step adds **no new core
  behaviour**, so **no new automated tests** are required; the existing suite is the
  prior art and the guarantee that the draft/expectation conversion is correct.
- The web wiring (button → dialog → create → refetch) has **no test harness** in the
  repo (only the `livemock` backend workspace has tests), consistent with every prior
  new-UI step. It is verified **manually via the Chrome DevTools MCP** when available:
  open a captured request, click Mock this request, save, and confirm the toast, the
  expectation appearing on the Expectation page, and that the mock actually serves the
  captured request.
- Type-check, lint and build pass for the `front-end` workspace; the backend test
  suite still passes.

## Out of Scope

- **Navigating to the Expectation page with the new expectation selected.** The
  design prototype does this; we chose to stay on the Request Log with a toast and a
  refetch.
- **Changing the conversion defaults** to match the design prototype (path
  `START_WITH`; query rows checked). The shared core helper keeps its current,
  tested defaults.
- The **desktop flavour** and its copy of the dialog.
- **Copy as cURL** and **per-log delete** (no endpoint; the design's header shows them
  but the port excludes them).
- Any matcher/action editing **beyond** what the dialog exposes.

## Further Notes

- Shared conversion: `core/import/fromLog.ts` (already tested).
- Dialog component: the web `frontEnd/src/component/expectation/MockFromLogModal.tsx`
  (+ its `.module.scss`); the desktop flavour has a near-identical copy that stays as
  is.
- Create call: the web expectation server (`POST /api/expectation/`), which returns
  the created expectation. The backend already broadcasts the create over the socket,
  and the Request Log page already handles expectation socket events.
- Tracker convention: this spec lives at `.scratch/new-ui-mock-from-log/spec.md`;
  implementation tickets go to `.scratch/new-ui-mock-from-log/issues/NN-<slug>.md`.
- Deliberate deviations from the design prototype (name kept; recorded here so a
  reviewer does not flag them): stay-on-page instead of navigate-and-select; keep the
  core pre-fill defaults; web-only.
