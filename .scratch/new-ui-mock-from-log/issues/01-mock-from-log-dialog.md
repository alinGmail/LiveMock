# 01: Mock this request — create a mock from a captured request

**What to build:** On the Request Log page, the detail pane's "Mock this request" button opens a dialog pre-filled from the selected captured request. Saving creates a custom-response expectation — only the checked rows become matchers, and the captured response becomes the mocked response — shows a success toast, refreshes the page's expectation data, and leaves the author on the Request Log. The button is disabled when the selected request has no request to mock, and stays available for requests that already matched an expectation.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The detail pane button opens the dialog for the currently selected request.
- [ ] The dialog is pre-filled from the capture: name `"<method> <path>"`; method and path matched by default; Query and Request-param rows listed but unchecked; response status, headers and pretty-printed JSON body from the capture.
- [ ] Rows can be checked/unchecked, each matcher row can pick a condition, and values can be edited before saving.
- [ ] Invalid JSON in the body blocks saving with a visible error; an empty body is accepted and saved as `{}`.
- [ ] Reset restores the capture; Cancel closes without creating anything.
- [ ] Saving creates exactly one expectation whose description is `"Mocked from request <method> <path>"`, then shows a success toast and closes.
- [ ] After saving, the page stays on the Request Log and its expectation data includes the new expectation.
- [ ] The button is disabled (with an explanatory title) when the selected request has no request payload, and enabled again otherwise — including for requests that already matched an expectation.
- [ ] The dialog renders correctly in the dark theme.
- [ ] Web only; the shared conversion helper is unchanged.
- [ ] Type-check, lint and build pass for the front-end; the backend test suite still passes.
