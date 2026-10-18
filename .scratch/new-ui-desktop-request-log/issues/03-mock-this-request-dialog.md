# 03: Mock this request dialog

**What to build:** Replace the old antd mock-from-log dialog with the redesigned web
dialog, opened from the inline detail header. A desktop user should be able to prefill,
adjust matchers and response, save, and stay on the Request Log with the expectation list
refreshed.

**Blocked by:** 02: Filter bar and live controls.

**Status:** ready-for-agent

- [ ] The detail header’s Mock this request button opens the redesigned dialog when the
      selected log has a request.
- [ ] The dialog pre-fills name, method/path/query/param matchers and response from the
      captured log using the shared core conversion.
- [ ] Matcher rows can be checked/unchecked and edited; response status, headers and JSON
      body can be edited in the dark Monaco editor.
- [ ] Invalid JSON blocks saving and shows an inline error.
- [ ] Saving creates the expectation through the existing IPC wrapper, sets the
      description to `Mocked from request METHOD PATH`, closes the dialog, shows a toast
      and refetches the expectation list.
- [ ] The page stays on the Request Log after saving.
- [ ] The old antd mock-from-log dialog is no longer used.
