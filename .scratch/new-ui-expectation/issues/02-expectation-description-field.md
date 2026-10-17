# 02: Expectation `description` field

**What to build:** An expectation can carry a human description. The web backend and the shared core model persist, return and update it through the existing expectation endpoints, so later UI can display it. No UI in this ticket.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] The shared expectation model gains `description: string`.
- [ ] Newly created expectations default to an empty description.
- [ ] A description set on an expectation survives create → list → detail → update → get through the existing web endpoints (the create insert and the update merge both carry it).
- [ ] Duplicating an expectation carries its description.
- [ ] Records stored before this change (no description) are read without error; missing is treated as an empty string.
- [ ] No database migration or backfill is introduced.
- [ ] Import builders, the batch-import overwrite path, and import parsing are left unchanged.
- [ ] The core workspace is rebuilt so backend and frontend consumers see the new field.
