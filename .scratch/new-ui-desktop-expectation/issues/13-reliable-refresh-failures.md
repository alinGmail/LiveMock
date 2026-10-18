# 13: Surface expectation refresh failures reliably

**What to build:** After a create, clone, expectation delete, group delete, group save or group toggle, the web and desktop Expectation pages must detect a failed list refresh and show the existing "list failed to refresh" toast. They must inspect the refetch result's error state instead of relying on a rejected promise, which does not reject under the current query client. Selection updates after create or clone happen only when the refresh succeeds.

**Blocked by:** 09, 10, 11 (audits the flows added by those tickets)

**Status:** done

- [x] Web and desktop inspect the refetch result for the listed flows instead of using a rejected-promise catch.
- [x] Successful refresh behavior is unchanged, including selecting a newly created or cloned row.
- [x] A failed refresh shows the appropriate toast; create/clone do not select a row absent from the list, while deletes keep the locally valid neighbor.
- [x] Group deletion attempts both refreshes and reports once if either fails.
- [x] Group save and group toggle refresh failures are surfaced.

## Note

Verification found a separate race between the Redux removal and the selection
effect: the effect could fall back to the first row after a delete. The fix is
included in commit `b95703d` for both flavours; the delete handlers now re-apply
the neighbor after the refresh settles.
