# 05: Scheduled trimming at startup and on a timer

**What to build:** Automatic enforcement of each project's maximum: one global background timer, registered when the app starts in both web and desktop, that periodically trims running projects, plus a one-time full trim at startup covering all projects. Config changes take effect on the next tick without a restart. The timer never keeps the process alive and never overlaps itself.

**Blocked by:** 03 — Trim a project's request logs down to a max; 04 — Race-safe asynchronous request log updates

**Status:** ready-for-agent

- [ ] A single global interval is registered at system start in both web and desktop, with a period of 60 seconds, and is unref'd.
- [ ] A re-entrancy guard prevents overlapping ticks.
- [ ] Each tick trims only projects whose status is STARTED, using the clamped effective max.
- [ ] Startup performs one trim across all projects, regardless of status.
- [ ] The runtime database path is used.
- [ ] End-to-end: an over-limit running project is trimmed within a tick; a restart with existing overflow trims on boot; changing the setting takes effect on the next tick without a restart.
- [ ] Type-check and lint pass.
