# ADR Index

Registry of Liftrack's architectural decision records (`adr/ADR-YYNNNN.md`), one row per record.
Status values are defined in
[`artifact-model.md`](../../generic/process/artifact-model.md) — this index is the **single
source of truth for each ADR's status**; do not restate it in overview documents.

Each ADR's status is in its row, not in this sentence. Only ADR-260007 and ADR-260008 have been
implemented, by EPIC-260007's first slice; the epic records how far its review has got.

## Index

| ID | Title | Status | Record | Related | Notes |
| --- | --- | --- | --- | --- | --- |
| `ADR-260001` | Workout domain model on the Crystord Atom model | `Accepted` | [`ADR-260001.md`](adr/ADR-260001.md) | REQ-FR-260002, REQ-FR-260003, REQ-FR-260004, REQ-FR-260005, REQ-CR-260003; `liftrack-atom-shape-contract.md`; ADR-260006; EPIC-260001 | Maps session ▸ performed exercise ▸ set onto atoms, labels and typed list content. **Accepted 2026-09-12** by the owner, no amendment. States once, for the owner to correct, that their word "sequence" is the standard gym term **set**. |
| `ADR-260002` | Static single-page frontend on GitHub Pages | `Proposed` | [`ADR-260002.md`](adr/ADR-260002.md) | REQ-OR-260001, REQ-OR-260002, REQ-CR-260002; EPIC-260002 | Records the owner's hosting constraint: a purely static SPA with no server runtime of its own and build-time configuration. Hosting target and routing style are open questions inside the record. Its backend-facing parts wait with EPIC-260002 (parked 2026-09-21); the first slice uses only a static build (ADR-260007). |
| `ADR-260003` | Online-only MVP without a local offline store | `Proposed` | [`ADR-260003.md`](adr/ADR-260003.md) | REQ-FR-260005, REQ-QR-260002; EPIC-260005 | Settled scope decision: no offline store, no write queue, no sync or conflict handling in MVP. Its cost is that a set is not logged until the mutation returns. |
| `ADR-260004` | Backend schema-compatibility handshake and version pinning | `Proposed` | [`ADR-260004.md`](adr/ADR-260004.md) | REQ-CR-260001, REQ-OR-260002, REQ-FR-260001; `crystord-graphql-contract.md`; EPIC-260003, EPIC-260006 | `schemaInfo` checked before any other call, and the pin policy that follows from a backend that is still moving. |
| `ADR-260005` | Session token storage and re-authentication in a static browser client | `Proposed` | [`ADR-260005.md`](adr/ADR-260005.md) | REQ-FR-260001, REQ-CR-260002; EPIC-260003 | Where the engine's expiring bearer token lives when there is no server to set a cookie, and how a mid-workout expiry is handled without losing the entry being typed. |
| `ADR-260006` | Capability-adaptive use of an evolving backend contract | `Proposed` | [`ADR-260006.md`](adr/ADR-260006.md) | REQ-CR-260001, REQ-CR-260003, REQ-FR-260003; ICR-260001, ICR-260003; EPIC-260006 | How Liftrack works within today's contract while keeping each workaround thin, named and removable, and pushes its own needs into the engine's ICR pipeline instead of absorbing them. |
| `ADR-260007` | Frontend stack — TypeScript, React and Vite | `Accepted` | [`ADR-260007.md`](adr/ADR-260007.md) | REQ-OR-260001, REQ-QR-260002; ADR-260002, ADR-260008; EPIC-260007 | **Accepted 2026-09-21** — chosen by the owner in session over plain HTML/CSS/JS, Astro and Svelte. Same toolchain and Pages workflow as `crystord_app`; two flagged differences (Node pinned from `.nvmrc` in CI, checks before publishing). |
| `ADR-260008` | First-slice workout content from repository files, behind a replaceable source | `Accepted` | [`ADR-260008.md`](adr/ADR-260008.md) | REQ-FR-260003, REQ-QR-260001, REQ-QR-260002; ADR-260001, ADR-260007; `liftrack-atom-shape-contract.md`; EPIC-260007 | Two JSON files and a picture folder mirroring ADR-260001, bundled and checked at build time; every planned day paged in file order (the owner's amendment, which replaced the weekday rule). **Accepted 2026-09-21** at EPIC-260007's plan review. |

## Superseded

None — no ADR has reached a terminal status.

## Tracking Rules

1. Keep this index synchronized with `adr/`.
2. Update status as records progress through their lifecycle.
3. Link related records (requirement / ICR / contract / epic) where relevant.
4. Never delete a row. On a terminal status, keep a tombstone link and move the row into the
   **Superseded** section above, per
   [`artifact-model.md`](../../generic/process/artifact-model.md).
5. Load on-demand when working with ADRs; open individual records only from this index.
