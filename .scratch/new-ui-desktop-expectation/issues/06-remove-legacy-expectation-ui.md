# 06: Remove legacy expectation UI and verify integrations

**What to build:** Delete the old expectation table, column editors, group columns,
context, old action/matcher editor trees and orphaned Import dialog now that the new page
is live. Keep the data layer and every integration the Request Log still depends on. The
desktop app should type-check, lint and build with no dead expectation UI left behind.

**Blocked by:** 05: Matcher and action editing.

**Status:** ready-for-agent

- [ ] The old expectation table page, column editors, group column components,
      expectation context, old action editor tree, old matcher editor tree and orphaned
      Import dialog are removed from the renderer.
- [ ] Desktop server wrappers, IPC channels, Redux slices and shared core helpers remain
      in place, including capabilities the new page does not call yet.
- [ ] The Request Log still loads, still renders expectation briefs, and “Mock this
      request” still creates an expectation through the existing dialog and wrapper.
- [ ] The NInput primitive remains because the Request Log filter still uses it.
- [ ] The desktop renderer passes type-check, lint and build without broken imports or
      unused module errors.
- [ ] Existing expectations, including records without a description, still load and
      render.
