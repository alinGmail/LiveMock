# 12: Align create validation and group counts with web

**What to build:** The add and clone dialogs allow submitting with an empty name and fall back to "New expectation" or "<source> (copy)", matching web. The group header count reflects the search-filtered member count, so it matches the rows currently visible; with no search it still shows full membership.

**Blocked by:** 08, 09 (both change the add dialog that this ticket aligns)

**Status:** ready-for-agent

- [ ] Creating with a blank name creates an expectation named "New expectation".
- [ ] Cloning with a blank name creates "<source> (copy)".
- [ ] The name field is still focused and selected appropriately when the dialog opens.
- [ ] With a search active, each group header count equals its matching member count; empty groups stay hidden.
- [ ] With no search, each group header count equals its full membership.
