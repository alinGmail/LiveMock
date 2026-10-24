# 01: API token core and bearer authentication

**What to build:** A browser session can create, list and revoke named API tokens. A valid token can call the data plane with `Authorization: Bearer` and no cookie. A token cannot create or revoke tokens or change the account password. Changing the password or resetting the account revokes every token.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Token records store a hash, a display prefix, a unique required name, creation time, optional expiry and last-used time; plaintext is returned only by the create call.
- [ ] `GET/POST/DELETE /api/auth/tokens` work for a session and reject a Bearer token with 403.
- [ ] `POST /api/auth/changePassword` rejects a Bearer token with 403.
- [ ] A valid token authenticates project, expectation, group, log and import requests.
- [ ] Expired and revoked tokens return 401.
- [ ] Duplicate or invalid token names return 400 with a readable message.
- [ ] Changing the password and resetting the account revoke all tokens.
- [ ] `/api/auth/me` reports whether the caller used a session or a token; existing session behaviour is unchanged.
- [ ] Backend tests cover the lifecycle through the composed API router.
