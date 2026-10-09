# 01: Design token layer and self-hosted fonts

**What to build:** The redesign's visual foundations are available across the web dashboard: the design's colour palette, surfaces, borders, radii and spacing as shared CSS custom properties, plus the Fira Sans (UI) and Fira Code (mono) typefaces served from the app's own assets. Every later ticket builds on these foundations.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] The design's tokens (background, deep background, surface levels, borders, text/muted/faint, accent/accent-2, success/warn/danger, type colours, radii, fonts) are exposed as global CSS custom properties with the design demo's dark values.
- [ ] Fira Sans and Fira Code are bundled with the frontend and loaded locally via `@font-face`; no runtime request is made to Google Fonts and the dashboard works offline.
- [ ] Only the font weights the design actually uses are bundled.
- [ ] Base UI typography uses Fira Sans and code/values use Fira Code.
- [ ] Existing global variables and antd surfaces keep working (no visual regression on existing pages).
- [ ] `prefers-reduced-motion` is respected by any transitions introduced here.
- [ ] A global focus-visible style is available for the new components.
