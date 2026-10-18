# 04: Remove the old Config page and project editor

**What to build:** Once Welcome, New project and Project settings use the new components,
remove the old Config page, the old antd project editor and their helper modules. The
`/config` route is removed; old links fall through the catch-all route to Expectation.

**Blocked by:** 01, 02, 03 (all callers must use the new components first)

**Status:** done

- [x] The old Config page and its `/config` route are gone.
- [x] The old project editor and its helper modules are gone.
- [x] No import references the deleted modules.
- [x] Navigating to `#/config` lands on Expectation through the catch-all route.
- [x] Desktop lint and renderer typecheck pass.
