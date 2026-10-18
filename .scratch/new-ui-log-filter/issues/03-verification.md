# 03: End-to-end verification

**What to build:** Verify the custom-filter feature against the running web app and the
backend, including persistence, active/inactive behavior, IN tags and keyboard access.

**Blocked by:** 02: Web custom-filter chips and editor.

**Status:** ready-for-agent

- [ ] Add a filter through the popover; the chip appears and the request list is filtered.
- [ ] Cancel/Escape/outside click leave no filter behind.
- [ ] Edit a filter's property, condition and value; the chip updates and the list
      refetches.
- [ ] Toggle Active off and on; the chip styling changes and the list stops/starts
      filtering.
- [ ] Add an IN filter with multiple tags; the chip shows the joined values and the list
      matches any of them.
- [ ] Remove a filter from both the chip x and the editor Delete; the chip disappears and
      the list refetches.
- [ ] Reload the page/project; custom filters and their active state persist.
- [ ] Invalid property/value/IN input cannot be saved.
- [ ] Keyboard: Enter/Space opens the editor, focus enters the popover, Escape closes it
      and focus returns to the originating control.
- [ ] Run web lint, type-check and build, plus the backend test suite and the new filter
      tests.
