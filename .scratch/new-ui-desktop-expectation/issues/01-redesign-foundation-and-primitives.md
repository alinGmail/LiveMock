# 01: Redesign foundation and shared primitives

**What to build:** Bring the web redesign’s visual foundation into the desktop renderer so
the later shell and Expectation page can be built against the same tokens, fonts and
primitives. This is a prefactor ticket: the app should still launch and behave exactly as
before, but the redesign’s design system must be available.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] The desktop renderer exposes the redesign’s global tokens for backgrounds,
      surfaces, borders, text levels, accents, semantic colours, radii, focus ring,
      spacing and sans/mono font stacks.
- [ ] Fira Sans and Fira Code are bundled with the desktop app and used by the global
      stylesheet; no external font request is made.
- [ ] The shared modal, toggle, select, button-style and Monaco dark-theme modules exist
      in the desktop renderer and compile without errors.
- [ ] The renderer builds and the existing desktop app still launches and renders its
      current pages without a visual regression beyond the new font/token availability.
