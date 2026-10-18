# 02: Custom filter chips and editor on the desktop Request Log

**What to build:** Desktop users can add, edit and remove custom filters from the Request
Log filter bar. Chips show property, condition and value, inactive filters look distinct,
and the editor is draft-first: cancel, Escape or outside click discard without saving.
Create, update and delete persist through the existing IPC wrappers, update Redux, and
refetch the log list.

**Blocked by:** 01 (needs the slice actions and editor component)

**Status:** done

- [x] Active and inactive chips render after the status-family chips, followed by a
      dashed Add filter control.
- [x] Add opens the editor with `req.path`, `CONTAINS`, empty value and Active on.
- [x] Chips open the editor with the filter cloned, so draft edits cannot mutate Redux.
- [x] The editor validates property and value; IN requires at least one tag; the primary
      action is disabled while invalid or saving.
- [x] Create, update and delete call the existing IPC wrappers, update Redux and refetch
      the log list.
- [x] The chip remove control deletes without opening the editor.
- [x] Cancel, Escape and outside click close without persisting.
- [x] Save and delete failures show a toast and keep the editor open.
- [x] Enter/Space opens chips and Add; focus enters the property field; Escape closes;
      focus returns to the origin or Add.
- [x] Add and chips are disabled until the log view has loaded.
