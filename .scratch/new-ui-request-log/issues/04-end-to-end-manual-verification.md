# 04: End-to-end manual verification

**What to build:** A single walkthrough confirming the new Request Log page works end to end on the web dashboard against live traffic.

**Blocked by:** 01, 02, 03.

**Status:** ready-for-agent

- [ ] The page shows the stream and detail side by side; selecting a row swaps the detail without navigating.
- [ ] Rows show the right fields; a request with no response shows as pending; a newly arrived row briefly highlights.
- [ ] Status-family chips (e.g. 4xx) filter the stream correctly, including a family with no matches; method and expectation filters work; the filters persist across a reload.
- [ ] Live indicator, Pause (stream freezes), Resume (list refetches), and Clear (with confirmation) all work.
- [ ] The Columns popover toggles expectation / duration / marker.
- [ ] Overview / Request / Response tabs render headers, query, status and pretty JSON; a websocket log shows the Websocket tab with message bubbles.
- [ ] The header button is inert (disabled); no copy/delete buttons.
- [ ] Empty states appear correctly (no requests vs no matches).
- [ ] The Expectation page, Add Expectation, and the shell still work.
- [ ] Any issue found is fixed or filed before this ticket is closed.
