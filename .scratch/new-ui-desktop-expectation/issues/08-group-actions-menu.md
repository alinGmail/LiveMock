# 08: Group actions menu

**What to build:** On the desktop Expectation page, the group kebab opens an actions menu instead of directly opening the group editor. The menu offers Edit group and New expectation. Edit group opens the existing group editor. New expectation expands the group and opens the add-expectation dialog with that group preselected and locked, then creates the expectation in it. The toolbar Add flow remains ungrouped by default. The menu closes on action, outside click and Escape, and the kebab stays visible while the menu is open.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] The group kebab opens a menu containing Edit group and New expectation.
- [x] Edit group opens the group editor for that group.
- [x] New expectation expands the group and opens the add dialog with the group preselected and not changeable.
- [x] Creating from the locked dialog puts the expectation in that group and selects it after refresh.
- [x] Toolbar Add still opens the dialog with the group selector editable.
- [x] Switching projects resets any open menu and locked-group state.
- [x] The menu closes after an action and on outside click or Escape.
