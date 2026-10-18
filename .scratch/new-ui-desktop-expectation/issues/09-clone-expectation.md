# 09: Clone expectation from the detail header

**What to build:** From the selected expectation's detail header, a copy action opens a clone dialog prefilled with the source name plus " (copy)", the source description and the source group. Submitting creates a clone with fresh expectation, matcher and action ids, preserving matchers, actions, delay, priority and activation, and resets the create time. On success the search is cleared, the target group is expanded, and the clone is selected after the list refresh. A failed request keeps the dialog open and reports the error.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The copy control appears only when an expectation is selected.
- [ ] The dialog title is "Clone expectation" and the submit labels are "Clone" / "Cloning…".
- [ ] The name is prefilled with "<source> (copy)", focused and selected.
- [ ] The clone has new ids for the expectation, every matcher and every action; all other behavior is preserved; create time is reset.
- [ ] The search is cleared, the target group is expanded, and the clone is selected after the refreshed list includes it.
- [ ] Closing is blocked while cloning; a failed request keeps the dialog open and shows an error toast.
- [ ] No new IPC or API channel is added; the existing create path is reused.
