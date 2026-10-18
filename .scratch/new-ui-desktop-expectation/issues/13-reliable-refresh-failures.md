# 13: Surface expectation refresh failures reliably

**What to build:** After a create, clone, expectation delete, group delete, group save or group toggle, the web and desktop Expectation pages must detect a failed list refresh and show the existing "list failed to refresh" toast. They must inspect the refetch result's error state instead of relying on a rejected promise, which does not reject under the current query client. Selection updates after create or clone happen only when the refresh succeeds.

**Blocked by:** 09, 10, 11 (audits the flows added by those tickets)

**Status:** ready-for-agent

- [ ] Web and desktop inspect the refetch result for the listed flows instead of using a rejected-promise catch.
- [ ] Successful refresh behavior is unchanged, including selecting a newly created or cloned row.
- [ ] A failed refresh shows the appropriate toast and does not select a row missing from the list.
- [ ] Group deletion attempts both refreshes and reports once if either fails.
- [ ] Group save and group toggle refresh failures are surfaced.
