# 05: Matcher and action editing

**What to build:** Restore the redesign’s matcher and action editors on the new
Expectation page. A desktop user should be able to change which requests an expectation
matches and what its first action returns or forwards, using the same dialogs as web.

**Blocked by:** 04: Expectation and group editing.

**Status:** ready-for-agent

- [ ] The Matchers dialog lists the current matchers and supports adding, editing and
      removing rows with type, condition, name and value controls that follow the shared
      matcher model.
- [ ] Presence conditions hide the value field, and matcher types that carry a name show
      the name field.
- [ ] Saving the Matchers dialog replaces the expectation’s whole matcher array through
      the generic expectation update and updates Redux.
- [ ] The Action dialog edits the first action of each supported type — custom response,
      proxy and static directory — with the existing fields, headers, body/status,
      proxy/static settings and validation.
- [ ] Saving the action uses the existing action update wrapper and updates Redux.
- [ ] The action card can delete the first action after confirmation, and can add a default
      custom-response action only when the expectation currently has none.
- [ ] Import, duplicate, delete-expectation and multi-action editing remain absent.
