# Contract Index

Registry of Liftrack's boundary contracts (`contracts/<name>-contract.md`), one row per record.
Status values are defined in
[`artifact-model.md`](../../generic/process/artifact-model.md) — this index is the **single
source of truth for each contract's status**; do not restate it in overview documents.

**Both contracts below are `Proposed`.** Neither has been confirmed by the parties it names:
the Crystord boundary contract describes an interface Liftrack has not yet called, and the atom
shape contract describes a data shape ADR-260001 has not yet had accepted.

## Index

| ID | Title | Status | Record | Related | Notes |
| --- | --- | --- | --- | --- | --- |
| `crystord-graphql-contract` | Crystord GraphQL boundary | `Proposed` | [`crystord-graphql-contract.md`](contracts/crystord-graphql-contract.md) | Interface: [`schema.graphql`](../../../backend/schema.graphql) (vendored, Crystord Engine `9.3.0`); REQ-CR-260001, REQ-CR-260002, REQ-CR-260003, REQ-FR-260001, REQ-FR-260005; ADR-260001, ADR-260004, ADR-260005, ADR-260006; ICR-260001, ICR-260003; `liftrack-atom-shape-contract.md`; EPIC-260001, EPIC-260006 | Type API. Provider Crystord Engine; consumer the Liftrack web client. Pinned to schema `9.3.0`. The provider is a separate project whose owner alone can change this interface, and it is actively evolving — so the contract records what Liftrack depends on, at which version, and which of its limits Liftrack has asked to change. |
| `liftrack-atom-shape-contract` | Liftrack atom shape | `Proposed` | [`liftrack-atom-shape-contract.md`](contracts/liftrack-atom-shape-contract.md) | REQ-FR-260002, REQ-FR-260003, REQ-FR-260004, REQ-FR-260005, REQ-CR-260003; ADR-260001, ADR-260006; ICR-260001, ICR-260003; `crystord-graphql-contract.md`; EPIC-260001, EPIC-260004, EPIC-260005 | Type database schema. Provider and consumer are both the Liftrack web client — the shape it writes into atoms and reads back. Needed as its own contract because the engine stores list content as one opaque value and can neither validate nor migrate the positional convention inside it; Liftrack is the only party that knows what a row means. This is the shape ADR-260001 would ratify. |

## Superseded

None — no contract has reached a terminal status.

## Tracking Rules

1. Keep this index synchronized with `contracts/`.
2. Update status as records progress through their lifecycle — for a cross-service contract,
   ratification follows the approval of the ICR that carries the change.
3. Link related records (requirement / ADR / ICR / epic) and the interface governed.
4. Never delete a row. On a terminal status, keep a tombstone link and move the row into the
   **Superseded** section above, per
   [`artifact-model.md`](../../generic/process/artifact-model.md).
5. Load on-demand when working with contracts; open individual records only from this index.
