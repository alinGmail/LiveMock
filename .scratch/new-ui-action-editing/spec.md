# Action editing for the Expectation detail (new UI — step 3)

**Status:** ready-for-agent

> Source of truth: the action editor in `new-ui/index.html` (~648–751) and
> `new-ui/design-notes.md` (line 39). Builds on the read-only Expectation page
> (`.scratch/new-ui-expectation/spec.md`) and the Add Expectation dialog
> (`.scratch/new-ui-add-expectation/spec.md`). Branch: `new-ui-expectation`.

## Problem Statement

The redesigned Expectation detail is read-only: its Action card shows the first action but offers no way to change it. A mock author therefore cannot change what a matched request returns or forwards — the core value of an expectation. The design already specifies how this should work (a pencil that opens an action editor modal, plus a delete button), and the old action-editor code still exists in the tree but is orphaned — nothing reachable from the routed UI uses it. This step completes the action editing feature in the new design.

## Solution

Make the first action of the selected expectation editable through the design's modal:

- The detail Action card gains an **edit** (pencil) button and, when an action exists, a **delete** (trash) button. When the expectation has no action, the card offers **Add action**.
- Editing (or adding) opens the **action editor modal**: a segmented type switcher (Custom response / Proxy / Static) over per-type fields, with Cancel and Save.
- Save issues a single update to the existing action endpoint; delete removes the action after a confirmation; Add action creates a default custom response and opens the editor on it.
- The modal is built on a **shared modal primitive** extracted alongside the existing Add Expectation modal, so both (and future editors) share one overlay, keyboard and focus implementation.

Only the first action of an expectation is shown and editable; the multi-action array is preserved for a future step. The web dashboard only; the desktop flavor is untouched.

## User Stories

1. As a mock author, I want an edit button on the selected expectation's action, so that I can change what a match returns.
2. As a mock author, I want the edit button to open a modal, so that I can configure the action without leaving the page.
3. As a mock author, I want a segmented switcher to change the action type, so that I can turn a response into a proxy or a static directory.
4. As a mock author, I want switching type to reset to that type's defaults, so that the fields I see always match the chosen type.
5. As a mock author editing a custom response, I want to set the HTTP status, so that the mock returns the right code.
6. As a mock author editing a custom response, I want to choose the response type (JSON or TEXT), so that the body is interpreted correctly.
7. As a mock author editing a custom response, I want to choose the content handler (NONE or MOCK_JS), so that mock-js templating can be enabled.
8. As a mock author editing a custom response, I want to add, edit and remove response headers, so that the response can carry the headers I need.
9. As a mock author editing a custom response, I want to edit the body as code with syntax highlighting, so that JSON responses are easier to write.
10. As a mock author editing a proxy action, I want to set the protocol and host, so that requests are forwarded to the right target.
11. As a mock author editing a proxy action, I want to set a prefix to remove, so that the forwarded path matches the target.
12. As a mock author editing a proxy action, I want to edit request and response headers, so that I can pass and return the headers I need.
13. As a mock author editing a proxy action, I want to toggle cross-origin handling, credentials, and websocket support, so that proxied calls behave as needed.
14. As a mock author editing a static-directory action, I want to set the folder path and URL prefix, so that files are served from the right place.
15. As a mock author, I want Cancel, the X, Esc and a backdrop click to close the editor without saving, so that I can back out safely.
16. As a mock author, I want Save to persist my changes in one action, so that I am not writing on every keystroke.
17. As a mock author, I want the list and detail to reflect my saved changes immediately, so that I can see the result.
18. As a mock author, I want a clear error if saving fails, with the editor staying open and my edits preserved, so that I do not lose work.
19. As a mock author, I want the Save button disabled while the request is in flight, so that I cannot submit twice.
20. As a mock author, I want to delete an action, so that a match can stop producing an action.
21. As a mock author, I want a confirmation before deleting, so that I do not remove it by accident.
22. As a mock author, I want the card to show the no-action state after deleting the only action, so that the expectation's state is clear.
23. As a mock author, I want an "Add action" control when an expectation has no action, so that I can give it one.
24. As a mock author, I want Add action to create a sensible default response and open the editor, so that I can immediately configure it.
25. As a mock author, I want only the expectation's first action shown and editable, so that the increment stays small while multiple actions remain possible.
26. As a keyboard user, I want the reused modal to trap focus while open and return focus to the trigger on close, so that I can operate it without a mouse.
27. As a LiveMock user, I want the editor to match the redesign's dark modal styling, so that the experience is consistent.
28. As a LiveMock user, I want the Add Expectation dialog to keep working after the modal primitive is extracted, so that the refactor introduces no regression.
29. As a maintainer, I want the orphaned old action-editor components removed, so that there is a single action-editing implementation.
30. As a desktop user, I want the desktop app unchanged in this step, so that the web increment can be validated first.

## Implementation Decisions

### Scope

- Web dashboard only. The Electron desktop renderer and main process are untouched. The shared core model and the backend are unchanged.
- Only the **first** action of an expectation is shown and editable; the `actions` array is retained for a future multi-action step.
- Matcher editing, `pathRewrite`, expectation-level delete/duplicate, and Import remain out of scope.

### Shared modal primitive (prefactor)

- Extract a reusable modal shell that renders through a portal onto `document.body` and provides: a backdrop that closes on click, close on the Esc key, a focus trap while open, focus restoration to the previously focused element on close, and header/body/footer composition (the header must be able to host the action editor's segmented switcher).
- Refactor the existing Add Expectation modal onto the primitive with **no behaviour change**.
- The action editor modal is built on the same primitive.

### Detail Action card

- With an action present: show the existing read-only action view plus an edit (pencil) button and a delete (trash) button.
- With no action: keep the "no action" state and add an **Add action** control.

### Action editor modal

- A segmented **type switcher** (Custom response / Proxy / Static) in the header, a close X, and a Cancel / Save footer.
- The draft is a deep copy of the action; the modal edits the draft only. Cancel, X, Esc or a backdrop click close without saving.
- **Switching type discards the draft and replaces it with a fresh default for the new type, keeping the same action id.**
- Fields by type (matching the design):
  - **Custom response**: HTTP status (number), response type (JSON/TEXT), content handler (NONE/MOCK_JS), response headers, and the response body edited in a code editor with syntax highlighting (JSON when the response type is JSON, plain text otherwise).
  - **Proxy**: protocol (http/https) and host, prefix remove, request headers, response headers, cross config (handle cross, allow credentials) and a websocket toggle. `pathRewrite` is not exposed.
  - **Static directory**: folder path and URL prefix.
- A header editor component provides add/edit/remove of key/value rows over a draft array, used by both the custom-response and proxy forms.
- Fixed, moderately wide modal (same width family as the design's action modal), body scrolls when tall.

### Save, delete and add

- **Save** issues a single update to the existing action endpoint for the action id, with the draft as the update. On success, update renderer state so the detail and list reflect the change immediately, and close the modal. On failure, show the existing error toast, keep the modal open with the draft intact, and re-enable Save. Save is disabled while the request is in flight.
- **Delete** asks for confirmation using the app's existing confirmation pattern, then calls the existing delete endpoint. On success, remove the action from renderer state; if it was the only action, the card returns to the no-action state (with Add action).
- **Add action** (only when none exists) creates a default custom-response action (status 200, JSON, empty body, no headers), then opens the editor on the newly created action.

### Cleanup

- Remove the orphaned old action-editor UI components and the action-specific context, since they are superseded. Keep and reuse the action server module and the action slice reducers (modify, add, remove), which the new UI will dispatch.

### Styling

- Design tokens and CSS modules, consistent with the rest of the page. Dark only.

## Testing Decisions

- A good test exercises externally observable behaviour through the highest existing seam and asserts outcomes.
- **No new automated tests.** Action create / update / delete are already covered by the backend controller suites; this step is presentation plus calls to those endpoints. There is no frontend test harness in this repo.
- **Manual verification via the Chrome DevTools MCP** covers: opening the editor from the pencil; each type's fields; type switching resetting fields; Cancel/X/Esc/backdrop not saving; Save persisting and updating the detail; save failure keeping the editor open; the delete confirmation and its effect; Add action creating and opening the editor; the extracted modal leaving the Add Expectation dialog working; focus trap and focus return.

## Out of Scope

- Matcher editing.
- Showing or editing more than the first action.
- `pathRewrite` editing.
- Expectation-level delete/duplicate and Import.
- Any change to the shared core model, the backend, or the desktop flavor.
- Light theme.
- Automated frontend tests.

## Further Notes

- Design references: the action editor markup/handlers in `new-ui/index.html` (~648–751) and the component inventory in `new-ui/design-notes.md` (line 39).
- The design's `statusText` has no equivalent in the shared model and is ignored; the design's textarea is replaced by a code editor for the body.
- The old editor tree is currently unreachable from the routed UI, so removing it cannot break a live path; the action endpoints and reducers it used are retained.
- Tracker convention: this spec lives at `.scratch/new-ui-action-editing/spec.md`; implementation tickets go to `.scratch/new-ui-action-editing/issues/NN-<slug>.md`.
