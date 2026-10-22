# 02: Settings page API token management

**What to build:** On the web Settings page, a user can manage API tokens without leaving the dashboard: create a named token with an optional expiry, copy the one-time plaintext, see the token list, and revoke a token.

**Blocked by:** 01 (API token core and bearer authentication)

**Status:** ready-for-agent

- [ ] The Settings page has an "API tokens" card below the account and password cards.
- [ ] The list shows name, masked prefix, creation time, last-used time and expiry.
- [ ] Creating a token requires a name and accepts never, 7, 30, 90 days, or a custom 1–3650 days.
- [ ] A successful create shows the full token exactly once with a copy action; it is not retrievable afterwards.
- [ ] Revoking asks for confirmation and removes the token from the list.
- [ ] Duplicate and empty names show inline errors.
- [ ] The page matches the existing Settings styling and works in the dark theme.
- [ ] The desktop Settings page is unchanged.
- [ ] The front-end build and lint pass; the manual checklist in the spec passes.
