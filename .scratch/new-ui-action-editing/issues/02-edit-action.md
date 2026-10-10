# 02: Edit the expectation's action

**What to build:** The selected expectation's first action can be edited through the design's action editor modal — a segmented type switcher over per-type fields, with Cancel and Save persisting in one request.

**Blocked by:** 01 (Shared modal primitive).

**Status:** ready-for-agent

- [ ] The detail Action card shows an edit (pencil) button on the first action; clicking it opens the action editor modal.
- [ ] The modal header has a segmented switcher (Custom response / Proxy / Static) and a close X; the footer has Cancel and Save.
- [ ] Editing operates on a deep-copied draft; Cancel, X, Esc and a backdrop click close without saving.
- [ ] Switching type discards the draft and replaces it with a fresh default for that type, keeping the same action id.
- [ ] Custom response fields: HTTP status (number), response type (JSON/TEXT), content handler (NONE/MOCK_JS), response headers (add/edit/remove rows), and the body in a code editor with JSON highlighting when the type is JSON, plain text otherwise.
- [ ] Proxy fields: protocol (http/https) and host, prefix remove, request headers, response headers, handle-cross and allow-credentials toggles, and a websocket toggle. `pathRewrite` is not exposed.
- [ ] Static directory fields: folder path and URL prefix.
- [ ] Save issues a single update to the existing action endpoint with the draft; on success the renderer state is updated so the detail and list reflect the change, and the modal closes.
- [ ] On save failure an error toast is shown, the modal stays open with the draft intact, and Save is re-enabled.
- [ ] Save is disabled while the request is in flight.
- [ ] Only the first action is shown and editable.
- [ ] The orphaned old action-editor UI components and the action-specific context are removed; the action server module and action slice reducers are retained and reused.
- [ ] Web only; the shared core model, backend and desktop flavor are unchanged.
