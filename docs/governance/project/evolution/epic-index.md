# Epic Index

Registry of Liftrack's epics (`epics/EPIC-YYNNNN.md`), one row per epic, **kept in priority
order**. Status values are defined in
[`artifact-model.md`](../../generic/process/artifact-model.md), and the scoring scheme behind
the Priority column in
[`epic-process.md`](../../generic/process/epic-process.md) — this index is the **single source
of truth for each epic's state and its ordering**. Task states live inline in the epic files and
are not repeated here.

Each Priority cell carries the score followed by the four inputs it was computed from
(UV = user value, Urg = urgency, Risk = risk reduction / learning value, Effort) so the ordering
can be audited and re-argued without opening a record.

Each epic's status is in its row. `EPIC-260007` passed the plan-review gate on 2026-09-21 and is
`Ready`; every other epic is `Ideation`.

**The original six epics are parked (2026-09-21).** The owner chose to start with a static page
that shows the planned workout days from files in the repository (`EPIC-260007`), with sign-in and the
backend to follow. A parked epic keeps its status and its score; its row moves to **Parked** below,
its record carries a dated note saying why and what resumes it, and it returns to the live list,
rescored, when the owner resumes it. Parking is a project convention within the generic status
model, not a status of its own.

## Index

| Priority | ID | Title | Status | Record | Related | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 6.00 — UV 4 · Urg 5 · Risk 3 · Effort 2 | `EPIC-260007` | Workout days page from content files | `Ready` | [`EPIC-260007.md`](epics/EPIC-260007.md) | ADR-260007, ADR-260008, ADR-260001; REQ-FR-260003, REQ-OR-260001, REQ-QR-260001, REQ-QR-260002 | The owner's chosen starting point: every planned day — each exercise with two pictures, a cue, sets and reps — paged on a phone, from files in the repository, before sign-in or the backend. Also the first scaffold, test suite and Pages deploy, which is where the risk score comes from. Its content mirrors ADR-260001, so the backend can replace the files without a redesign. Plan amended by the owner 2026-09-21 (paging replaces the weekday rule). |

## Parked

Parked by the owner on 2026-09-21, in their previous priority order. Each record's opening note says
what EPIC-260007 absorbs from it, if anything, and what resumes it.

| Priority | ID | Title | Status | Record | Related | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 6.50 — UV 3 · Urg 5 · Risk 5 · Effort 2 | `EPIC-260001` | Agree the workout domain model and backend contract | `Ideation` | [`EPIC-260001.md`](epics/EPIC-260001.md) | ADR-260001, ADR-260004; `liftrack-atom-shape-contract.md`, `crystord-graphql-contract.md`; REQ-FR-260002, REQ-FR-260004, REQ-FR-260005, REQ-CR-260001 | First because every other epic inherits its answer. How a session, its exercises and their sets are stored decides how many atoms a read returns, which decides whether a read is silently truncated. The shape is cheap to change while nothing is written and expensive afterwards — the engine stores list content opaquely and can neither validate nor migrate it. |
| 5.50 — UV 2 · Urg 5 · Risk 4 · Effort 2 | `EPIC-260002` | Project scaffold and GitHub Pages delivery | `Ideation` | [`EPIC-260002.md`](epics/EPIC-260002.md) | ADR-260002, ADR-260004; REQ-OR-260001, REQ-OR-260002, REQ-CR-260002 | Low direct user value, high urgency: nothing can be shown to the owner until a static build reaches a URL over HTTPS, and the hosting target chosen here also decides the token-storage and sign-in questions in EPIC-260003. |
| 5.00 — UV 3 · Urg 4 · Risk 3 · Effort 2 | `EPIC-260003` | Account access | `Ideation` | [`EPIC-260003.md`](epics/EPIC-260003.md) | ADR-260005, ADR-260004; REQ-FR-260001, REQ-CR-260002 | Every other read and write needs a session token first. Carries the mid-workout expiry case: the engine's token expires on its own schedule and, with no offline queue, a re-authentication between typing a weight and saving it loses the entry. |
| 3.33 — UV 4 · Urg 4 · Risk 2 · Effort 3 | `EPIC-260004` | Upfront plan authoring | `Ideation` | [`EPIC-260004.md`](epics/EPIC-260004.md) | ADR-260001; REQ-FR-260002, REQ-FR-260005 | The owner's "all of this was planned upfront". Ranks below the enabling epics only on effort and risk — the design risk it carries is settled by EPIC-260001, not by this epic. |
| 3.25 — UV 5 · Urg 5 · Risk 3 · Effort 4 | `EPIC-260005` | Today's workout and set logging | `Ideation` | [`EPIC-260005.md`](epics/EPIC-260005.md) | ADR-260001, ADR-260003; REQ-FR-260003, REQ-FR-260004, REQ-FR-260005, REQ-QR-260001, REQ-QR-260002 | The product the owner actually asked for, and low in the ordering purely on effort — it is the largest epic and the one that depends on all four above it. A low score here is a sequencing statement, not a value judgement. |
| 3.00 — UV 1 · Urg 2 · Risk 3 · Effort 2 | `EPIC-260006` | Raise Liftrack's read-pattern needs into the Crystord contract | `Ideation` | [`EPIC-260006.md`](epics/EPIC-260006.md) | ICR-260001, ICR-260003; REQ-CR-260001, REQ-CR-260003; ADR-260006; `crystord-graphql-contract.md` | Last, deliberately: it delivers the lifter nothing directly, so user value is at the floor of the scale and it does not gate any product epic above it — EPIC-260001's domain model is designed to fit the backend unmodified (see that epic's Links). Urgency is real but modest: the engine's own request is undecided and a named consumer's input has more weight before that decision than after, but nothing here blocks shipping. Revisit urgency upward if the engine's decision looks imminent. |

## Tracking Rules

1. Keep this index synchronized with `epics/`, and keep rows in priority order.
2. Update an epic's status here as it moves through its lifecycle; task states stay inline in
   the epic file.
3. Link the records each epic spawns or depends on (requirement / ADR / ICR / contract).
4. Never delete a row. A `Done` epic's brief is frozen in place and its row stays listed, per
   [`artifact-model.md`](../../generic/process/artifact-model.md).
5. Load on-demand when planning or prioritizing; open individual epics only from this index.
6. Rescore and reorder when the inputs change, and record why in the epic's own record.
7. Park an epic only on the owner's decision: keep its status and score, move its row to
   **Parked**, and add a dated note to its record. Resuming moves the row back, rescored.
