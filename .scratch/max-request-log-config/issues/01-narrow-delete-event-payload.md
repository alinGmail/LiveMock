# 01: Narrow the live delete event payload to the log id

**What to build:** Changing a Request Log's live delete notification so it carries only the log id and the log view id, end to end across web and desktop, instead of the entire log document. Consumers only ever used the id, so the visible behaviour is unchanged: a deleted Request Log disappears from the open log view, and "delete all request logs" still clears the list.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The dynamic-view delete callback emits only `{ id, logViewId }`, in both flavours.
- [ ] The web socket delete event and the desktop IPC delete event send the id-only payload, and their payload types reflect it.
- [ ] Both Request Log pages still remove the correct row on receiving a delete event.
- [ ] Manual "delete all request logs" still clears the visible list in both flavours.
- [ ] Type-check and lint pass.
