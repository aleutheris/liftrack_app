# Requirement Index

Registry of Liftrack's requirement records (`requirements/REQ-XY-YYNNNN.md`, where `XY ∈ {FR,
QR, OR, CR}`), one row per record. Status values are defined in
[`artifact-model.md`](../../generic/process/artifact-model.md) — this index is the **single
source of truth for each requirement's status**; do not restate it in overview documents.

**Every requirement below is `Proposed`.** None has been ratified by the repository owner, and
none has been built — Liftrack has no application code yet. `Related` lists the ADRs and epics
each requirement traces to.

## Index

| ID | Title | Status | Record | Related | Notes |
| --- | --- | --- | --- | --- | --- |
| `REQ-FR-260001` | Account access and session lifecycle | `Proposed` | [`REQ-FR-260001.md`](requirements/REQ-FR-260001.md) | ADR-260005, ADR-260004; EPIC-260003 | Sign-in, sign-out and re-authentication against the engine's expiring, revocable bearer token. A gym visit is a long-idle usage pattern, so expiry mid-workout is an MVP case, not an edge case. |
| `REQ-FR-260002` | Upfront workout plan authoring | `Proposed` | [`REQ-FR-260002.md`](requirements/REQ-FR-260002.md) | ADR-260001; EPIC-260004 | The planned half of the owner's brief: maintaining the exercise catalogue itself, then which exercises, how many sets and how many reps — decided before the gym rather than at the rack. |
| `REQ-FR-260003` | Today's workout presentation | `Proposed` | [`REQ-FR-260003.md`](requirements/REQ-FR-260003.md) | ADR-260001, ADR-260006, ADR-260008; EPIC-260001, EPIC-260005, EPIC-260007 | What the user sees on arriving at the gym: today's exercises with their planned sets and reps, on a phone. |
| `REQ-FR-260004` | Set-level logging of reps and weight | `Proposed` | [`REQ-FR-260004.md`](requirements/REQ-FR-260004.md) | ADR-260001, ADR-260003; EPIC-260005 | The owner's "save the amount of sequences and reps, and also their weights per sequence". ADR-260001 carries the set/sequence terminology note. |
| `REQ-FR-260005` | Durable persistence and retrieval of plans and sessions | `Proposed` | [`REQ-FR-260005.md`](requirements/REQ-FR-260005.md) | ADR-260001, ADR-260003; EPIC-260001, EPIC-260005 | What is written must be readable again later and from another browser. Online-only means nothing is held client-side to make that true. |
| `REQ-QR-260001` | One-handed mobile usability during a workout | `Proposed` | [`REQ-QR-260001.md`](requirements/REQ-QR-260001.md) | ADR-260001, ADR-260003, ADR-260005; EPIC-260005, EPIC-260007 | The logging flow is used standing, between sets, with one hand and often sweaty fingers. |
| `REQ-QR-260002` | Perceived responsiveness on mobile networks | `Proposed` | [`REQ-QR-260002.md`](requirements/REQ-QR-260002.md) | ADR-260003, ADR-260001; EPIC-260005, EPIC-260007 | Bounds the round trips a gym-time interaction may cost. Online-only (ADR-260003) makes every interaction a network round trip over gym wifi. |
| `REQ-OR-260001` | Static hosting on GitHub Pages | `Proposed` | [`REQ-OR-260001.md`](requirements/REQ-OR-260001.md) | ADR-260002, ADR-260007; EPIC-260002, EPIC-260007 | The owner's only stack constraint. No server runtime, no request-time configuration, no response-header control. |
| `REQ-OR-260002` | Client observability minimum | `Proposed` | [`REQ-OR-260002.md`](requirements/REQ-OR-260002.md) | ADR-260002, ADR-260004; EPIC-260002 | GitHub Pages exposes no access logs, so a failing client can be invisible. The diagnostic surface has to be the UI itself. |
| `REQ-CR-260001` | Consume the Crystord contract unmodified | `Proposed` | [`REQ-CR-260001.md`](requirements/REQ-CR-260001.md) | ADR-260004, ADR-260006; `crystord-graphql-contract.md`; EPIC-260001, EPIC-260006 | Liftrack changes nothing in the engine repository. Every need it cannot meet becomes an ICR raised as a consumer, decided by the engine's owner. |
| `REQ-CR-260002` | Browser-only secret handling over an HTTPS backend origin | `Proposed` | [`REQ-CR-260002.md`](requirements/REQ-CR-260002.md) | ADR-260002, ADR-260005; EPIC-260003 | A Pages bundle is world-readable, so no credential may enter the repository or the build output; the only bearer material is the user's own runtime token, and the endpoint must be `https://` or the browser blocks the request. |
| `REQ-CR-260003` | No silent truncation of a bounded result set | `Proposed` | [`REQ-CR-260003.md`](requirements/REQ-CR-260003.md) | ADR-260006, ADR-260001; ICR-260001; EPIC-260006 | `retrieve` caps at 25 atoms with no truncation signal (`crystord/atom_interactions/inter_fundamentals.py:1406-1407`, applied at `:1419`), so a capped read is indistinguishable from a complete one. Liftrack must never present one as complete. |

## Superseded

None — no requirement has reached a terminal status.

## Tracking Rules

1. Keep this index synchronized with `requirements/`.
2. Update status as records progress through their lifecycle.
3. Link related records (ADR / ICR / contract / epic) where relevant.
4. Never delete a row. On a terminal status, keep a tombstone link and move the row into the
   **Superseded** section above, per
   [`artifact-model.md`](../../generic/process/artifact-model.md).
5. Load on-demand when working with requirements; open individual records only from this index.
