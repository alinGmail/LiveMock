# 14: Update the desktop expectation spec and tickets

**What to build:** The desktop expectation spec and its tickets must reflect that duplicate, delete expectation and delete group are now ported. Add a ticket that records the ported actions, the decision to align empty-name handling and group counts with web, the reliable refresh-failure decision, the accessibility follow-up and the manual verification scope. Leave the historical web specs untouched and note that the new ticket supersedes their earlier out-of-scope claims.

**Blocked by:** 08, 09, 10, 11, 12, 13 (records the final behavior)

**Status:** ready-for-agent

## Decisions recorded

- Empty-name handling and search-time group counts follow web (ticket 12).
- Refresh failures are detected from the refetch result, not a rejected promise, in both
  web and desktop (ticket 13).
- The group actions menu keeps web’s plain-button markup; ARIA menu semantics and
  arrow-key navigation are a follow-up, not part of this port.
- Historical web specs stay untouched; this ticket and tickets 08–15 supersede their
  earlier out-of-scope claims.
- Verification is desktop lint, renderer typecheck, web lint/build and a manual Electron
  smoke test with screenshots (ticket 15).

- [ ] The spec no longer claims duplicate, delete expectation or delete group are out of scope.
- [ ] Tickets 04, 05 and 07 no longer claim those controls are absent.
- [ ] A new ticket documents scope, decisions and the verification checklist.
- [ ] Historical web specs are untouched and the supersession is noted.
- [ ] No stale "not ported" claim remains in the desktop docs.
