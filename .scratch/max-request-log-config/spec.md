# Max Request Log Count (per project)

Status: ready-for-agent

## Problem Statement

A project's Request Log grows without bound. Every request that matches an expectation is appended to the project's log store, and nothing ever removes old entries, so a long-running mock server accumulates logs indefinitely. This grows the on-disk database and the in-memory collection, slows the Request Log page, and can eventually exhaust host resources. Users have no way to cap how much history a project keeps.

## Solution

Add a per-project setting, **max request log count**, shown on the project configuration UI alongside the existing project name / port / description. It defaults to **5000** and has a hard floor of **1000**. While the app runs, a background task periodically trims each running project's Request Log down to its configured maximum, always deleting the oldest entries first and never touching a Request Log whose WebSocket is still open. On startup, the same trimming is applied once to every project so pre-existing overflow is cleared. Changing the setting takes effect within one trim interval, with no restart.

## User Stories

1. As a LiveMock user, I want to set a maximum number of Request Logs per project, so that a long-running mock server does not accumulate unbounded history.
2. As a LiveMock user, I want the maximum to default to 5000, so that protection is on out of the box without configuration.
3. As a LiveMock user, I want a minimum of 1000 enforced, so that I cannot accidentally configure a value so small that useful history is lost.
4. As a LiveMock user, I want a value below 1000 to be automatically treated as 1000, so that a fat-fingered input does not disable logging.
5. As a LiveMock user, I want to edit the maximum on the config page using the same project editor I already use, so that I do not learn a new workflow.
6. As a LiveMock user, I want the maximum to be editable when creating a project and when editing an existing one, so that I can choose the value at either point.
7. As a LiveMock user, I want the setting to save with the project using the existing auto-save, so that I do not press a separate save button.
8. As a LiveMock user, I want a changed maximum to take effect without restarting the server, so that I can tune it while debugging.
9. As a LiveMock user, I want overflow trimmed on a schedule, so that the app stays bounded without me doing anything.
10. As a LiveMock user, I want pre-existing overflow cleaned up when the app starts, so that upgrading or importing a project does not leave it over the limit.
11. As a LiveMock user, I want the oldest Request Logs removed first, so that the most recent traffic is always available.
12. As a LiveMock user, I want the newest `max` Request Logs preserved, so that the log view keeps showing the freshest activity.
13. As a LiveMock user, I want Request Logs whose WebSocket is still open to be skipped by trimming, so that a live session is not disrupted.
14. As a LiveMock user, I want the "unclosed WebSocket Request Log id" bookkeeping cleaned up when a log is trimmed, so that stale ids do not linger on the project.
15. As a LiveMock user, I want the open Request Log page to drop trimmed rows via the existing live delete event, so that the visible list stays consistent without a refresh.
16. As a LiveMock user, I want trimming to never throw when a response or WebSocket update races with a trim, so that a busy mock server keeps serving.
17. As a LiveMock user, I want the per-project maximum to apply independently to each project, so that one noisy project does not consume another project's budget.
18. As a LiveMock user, I want only running projects trimmed on each tick, so that stopped projects' data is left alone and not loaded into memory needlessly.
19. As a LiveMock user, I want the setting to be available identically in the web and desktop apps, so that both flavours behave the same.
20. As a LiveMock user, I want the manual "delete all request logs" action to keep working, so that I can still clear history on demand.
21. As a LiveMock user, I want existing projects that predate this setting to behave as if they had 5000, so that nothing changes until I opt in.
22. As a LiveMock user, I want an invalid or cleared max input to fall back to 5000, so that the project is never left unconfigured.
23. As a LiveMock user, I want the Request Log list and its pagination to keep working after trims, so that browsing history is unaffected.
24. As a LiveMock maintainer, I want trimming to be a pure, well-tested function, so that its behaviour can be verified without running a server.
25. As a LiveMock maintainer, I want the live delete event to carry only the log id, so that bulk trimming does not push large full-log payloads to clients.

## Implementation Decisions

### Data model

- The project model gains a numeric field, `maxRequestLogNumber`. The project factory returns `5000`.
- Legacy projects do not get migrated: the field may be absent at runtime. Reads go through a single helper that returns `Math.max(1000, project.maxRequestLogNumber ?? 5000)`. This is the only place the 1000 floor and the 5000 default are applied for server behaviour.
- The 1000 floor is deliberately **not** part of the trimming function so tests can drive it with smaller values.

### Configuration UI

- The shared project editor gains one numeric input, labelled for max request logs. It renders in both the "add project" flow and the edit flow (config page / project info).
- The input is an integer `InputNumber` with a minimum of 1000. It displays the effective value (`project.maxRequestLogNumber ?? 5000`). On change it clamps to at least 1000; cleared or invalid input falls back to 5000.
- No new REST route or IPC channel is introduced. The value round-trips through the existing project update contract (`projectUpdate` as a partial project), which the config page already auto-saves with a debounce.

### Trim task

- A single global interval (one per process, not one per project) is registered at system start, in both flavours: web backend startup and the Electron main process startup.
- Interval length is 60 seconds; the timer is `unref`ed so it never keeps the process alive. A re-entrancy guard prevents overlapping ticks.
- Each tick: load the project collection, and for every project whose status is STARTED, resolve the effective max and trim that project's log collection.
- On startup, the same trim is applied once across **all** projects (regardless of status) to clear pre-existing overflow.
- The database path used is the same runtime path the log listener uses.

### Trimming algorithm

- Given a log collection and an arbitrary `max`, count the entries. If count ≤ max, do nothing.
- Select the oldest `count - max` entries by ascending log id, **excluding** any entry whose WebSocket info status is OPEN.
- Remove the selected entries in one batch.
- Return the removed ids so the caller can reconcile project state.
- The caller removes those ids from the project's unclosed-WebSocket id list and updates the project.
- Because removal happens via the collection, existing dynamic views emit their delete events and the log views prune live. No extra notification plumbing is added.

### Delete event payload

- The live delete event currently sends the entire log document; the client only uses the id. Narrow the payload to `{ id, logViewId }` across both flavours: the dynamic-view delete callback, the server emit, the desktop IPC send, the event types, and both client handlers.
- The client already locates rows by id, so this is a type/payload narrowing rather than a behavioural change.

### Race safety

- Loki's `update` throws once a document has been removed (it also strips `$loki` from the shared reference), so an in-flight response or WebSocket update can throw after a trim.
- Every asynchronous log update site is wrapped defensively so a trim race cannot surface as an error: the response-log update in the log utilities, and the five WebSocket proxy update sites, in both flavours.
- Skipping OPEN WebSocket logs in the trim algorithm plus the defensive guards is intentional belt-and-suspenders.

### Parity

- Project model, project editor, event types, and event payload changes live in the shared core and are consumed unchanged by both flavours.
- Server trim task and defensive update guards are implemented in both the web backend and the Electron main process, mirroring the existing duplicate-tree convention.

## Testing Decisions

What makes a good test here: exercise externally observable behaviour of the trimming function against a real collection — which entries survive, which are removed, and what the function reports — rather than asserting on internal calls or ordering of private helpers.

- Primary seam: the pure trimming function, which accepts a log collection and a `max` and returns the removed ids. This is the single highest seam that covers ordering, the OPEN-WebSocket exclusion, the overflow calculation, and batch removal.
- Small values are used in tests (for example `max = 100`, or smaller), which is explicitly allowed because the 1000 floor lives only in the config-read helper, not in the trimming function.
- Cases to cover: under the limit (no-op), exactly at the limit (no-op), over the limit (oldest removed, newest kept), `max` below current count, OPEN WebSocket entries skipped while older closed entries are still removed, reported removed ids match what disappeared, and empty collection.
- The project-state reconciliation (cleaning the unclosed-WebSocket id list for removed ids and persisting the project) is covered at the orchestration seam with a real project collection.
- Prior art: the existing Jest suites under the backend tests, which already build real Loki collections against a temporary database folder and clean it up afterwards (see the log and lokijs test suites). Follow the same setup/teardown style.

## Out of Scope

- A global (cross-project) cap, or storing the value in the system config collection.
- Migrating legacy projects to persist a default value.
- Time-based or size-based retention; only count-based trimming is covered.
- Changing the manual "delete all request logs" behaviour beyond narrowing the delete event payload.
- Any new REST route, IPC channel, or database collection.
- Reducing how often full log payloads are sent for insert/update events.
- Server-side validation surfacing errors to the user for out-of-range values (the UI clamps; the server clamps on read).

## Further Notes

- Confirmed during design: Loki's `update` throws `Trying to update a document not in collection.` after removal, and `remove` deletes `$loki` from the same object reference held by the in-flight request, which is why the defensive guards and the OPEN-WebSocket exclusion are both required.
- Rationale for narrowing the delete payload: a single trim can remove many entries at once, and the delete event fires per entry; sending full log documents (with request/response bodies) would produce a large burst, while the client only needs the id.
- The engineering-skills issue tracker was not configured in this repo when this spec was written; it was recorded using the local-markdown convention (`.scratch/<feature>/spec.md`). Run `/setup-matt-pocock-skills` to wire specs into a real tracker.
