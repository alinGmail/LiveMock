# 01: Edit matchers panel

**What to build:** A mock author opens an edit panel from the Matchers card and edits the expectation's matchers inline — add, remove, and change type/condition/name/value — then saves them all in one request.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] The Matchers card header shows an edit (pencil) button that opens a modal panel built on the shared modal primitive (portal, Esc/backdrop/X/Cancel close, focus trap, focus restore).
- [ ] The panel edits a deep-copied draft; Cancel, X, Esc and a backdrop click discard it.
- [ ] Each matcher renders as one inline row: a type select (method/path/header/query/param), a condition select (all `MatcherCondition` values), a name input, a value input, and a delete icon.
- [ ] Switching a matcher's type replaces it with a fresh default for the chosen type while keeping the same matcher id.
- [ ] The name input is shown only for header/query/param matchers; the value input is hidden for showed / not showed conditions.
- [ ] The delete icon removes the matcher from the draft immediately, without confirmation.
- [ ] "Add matcher" appends a default path matcher to the draft; an empty list shows a "no matchers" state with the Add control.
- [ ] Save sends one expectation update carrying the whole matchers array; on success renderer state is updated and the panel closes.
- [ ] On failure an error toast is shown, the panel stays open with the draft, and Save is re-enabled; Save is disabled while the request is in flight.
- [ ] The orphaned pre-redesign matcher UI and plumbing that nothing else uses are removed (inline matcher item, matcher type selector, matcher context, frontend matcher server, matcher slice and its slice wiring); the shared inline input used by the log filter is kept.
- [ ] Web only; the shared core model, backend and desktop flavor are unchanged.
