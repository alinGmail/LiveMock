# 01: Shared modal primitive

**What to build:** A reusable modal shell used by the app's dialogs, and the existing Add Expectation dialog refactored onto it with no behaviour change. This is the prefactor the action editor builds on.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A reusable modal component renders through a portal onto `document.body` and provides an overlay (backdrop click closes), Esc-to-close, a focus trap while open, and focus restoration to the previously focused element on close.
- [ ] It composes a header, a scrollable body, and a footer, and its header can host extra content (so the action editor can put its segmented type switcher there).
- [ ] It supports a fixed moderately wide size (the design's action-modal width family) and a smaller size (the Add Expectation dialog).
- [ ] The existing Add Expectation dialog is refactored onto the primitive with identical behaviour: same fields, Name autofocused, Cancel/X/Esc/backdrop close, focus trap, focus return to the Add button, Create flow unchanged.
- [ ] The primitive and the refactored dialog use the design tokens and CSS modules, dark only.
- [ ] No behaviour regression in the Add Expectation flow.
