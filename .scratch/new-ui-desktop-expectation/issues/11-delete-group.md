# 11: Delete group from the group actions menu

**What to build:** The group actions menu gains a visually separated danger item, Delete group. Its confirmation shows the group name and a pluralized count of the expectations that will be removed. Confirming cascades the deletion of every member expectation and the group through the existing API, preserves request logs, moves the selection only when the selected expectation belonged to that group, and refreshes the group list before the expectation list.

**Blocked by:** 10 (uses the shared destructive confirmation dialog)

**Status:** ready-for-agent

- [ ] Delete group appears after a separator in danger styling.
- [ ] The confirmation count matches the full member set; singular and plural wording are correct.
- [ ] Deleting an empty group says only that the group will be removed.
- [ ] Deleting removes the group and all of its expectations; request logs remain.
- [ ] Selection moves correctly when the selected expectation was a member and stays put when it was not.
- [ ] A failed request keeps the dialog open; a failed refresh is reported.
