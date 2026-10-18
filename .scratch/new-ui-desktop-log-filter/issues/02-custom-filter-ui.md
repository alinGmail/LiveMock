# 02: Custom filter chips and editor on the desktop Request Log

**What to build:** Desktop users can add, edit and remove custom filters from the Request
Log filter bar. Chips show property, condition and value, inactive filters look distinct,
and the editor is draft-first: cancel, Escape or outside click discard without saving.
Create, update and delete persist through the existing IPC wrappers, update Redux, and
refetch the log list.

**Blocked by:** 01 (needs the slice actions and editor component)

**Status:** ready-for-agent

- [ ] Active and inactive chips render after the status-family chips, followed by a
      dashed Add filter control.
- [ ] Add opens the editor with `req.path`, `CONTAINS`, empty value and Active on.
- [ ] Chips open the editor with the filter cloned, so draft edits cannot mutate Redux.
- [ ] The editor validates property and value; IN requires at least one tag; the primary
      action is disabled while invalid or saving.
- [ ] Create, update and delete call the existing IPC wrappers, update Redux and refetch
      the log list.
- [ ] The chip remove control deletes without opening the editor.
- [ ] Cancel, Escape and outside click close without persisting.
- [ ] Save and delete failures show a toast and keep the editor open.
- [ ] Enter/Space opens chips and Add; focus enters the property field; Escape closes;
      focus returns to the origin or Add.
- [ ] Add and chips are disabled until the log view has loaded.
