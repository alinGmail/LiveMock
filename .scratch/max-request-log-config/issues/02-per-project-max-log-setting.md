# 02: Per-project maximum request log setting

**What to build:** A new per-project setting, "max request log number", defaulting to 5000, editable through the existing project editor on both the add-project and edit screens, and persisted through the existing project auto-save. A project whose value has never been set (legacy projects) behaves as 5000. The value is exposed server-side through a single helper that enforces the 1000 minimum and the 5000 default. No new API endpoint or IPC channel is introduced.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] New projects have the setting at 5000; legacy projects without the field are treated as 5000.
- [ ] The shared project editor shows the field in both the create and edit flows, accepts integers only, and enforces a minimum of 1000.
- [ ] Entering a value below 1000 clamps to 1000; clearing or entering an invalid value falls back to 5000; a legacy project displays 5000.
- [ ] The setting round-trips through the existing project update / auto-save and survives a reload, in both web and desktop.
- [ ] The server-side read helper returns `max(1000, value ?? 5000)`, with unit tests for missing, below-minimum, and valid values.
- [ ] No new REST route or IPC channel is added.
