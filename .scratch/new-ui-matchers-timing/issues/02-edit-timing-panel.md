# 02: Edit Timing & state panel and interactive header switch

**What to build:** A mock author opens an edit panel from the Timing & state card and sets delay, priority, group and active in one save; the detail header's Active switch also toggles immediately.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] The Timing & state card header shows an edit (pencil) button that opens a modal panel built on the shared modal primitive (portal, Esc/backdrop/X/Cancel close, focus trap, focus restore).
- [ ] The panel edits a deep-copied draft; Cancel, X, Esc and a backdrop click discard it.
- [ ] The panel has a delay number field and a priority number field; an invalid or empty value becomes 0 and a negative value is not allowed.
- [ ] The panel has a group select listing ungrouped plus the current project's groups.
- [ ] The panel has an active toggle.
- [ ] Save sends one expectation update with `{ delay, priority, groupId, activate }`; on success renderer state is updated and the panel closes.
- [ ] On failure an error toast is shown, the panel stays open with the draft, and Save is re-enabled; Save is disabled while the request is in flight.
- [ ] The detail header's Active switch is interactive and toggles immediately (outside the panel): it updates renderer state and issues the expectation update for `activate`, reverting on failure.
- [ ] Web only; the shared core model, backend and desktop flavor are unchanged.
