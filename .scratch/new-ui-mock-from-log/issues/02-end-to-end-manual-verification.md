# 02: End-to-end manual verification

**What to build:** A single walkthrough confirming "Mock this request" works end to end on the web dashboard against live traffic.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Selecting a captured request and clicking "Mock this request" opens the dialog pre-filled with the method, path, query/params, response status, headers and body.
- [ ] Saving creates the expectation, shows a success toast, and leaves the page on the Request Log.
- [ ] The new expectation appears on the Expectation page with the description `"Mocked from request <method> <path>"` and the chosen matchers/response.
- [ ] Replaying the request against the mock port returns the mocked status and body.
- [ ] The button is disabled (with a tooltip) for a request with no request payload, and enabled for a request that already matched an expectation.
- [ ] Invalid JSON blocks saving; Reset restores the capture; Cancel closes without creating.
- [ ] Any issue found is fixed or filed before this ticket is closed.
