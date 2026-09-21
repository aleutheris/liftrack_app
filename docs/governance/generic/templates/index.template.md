# `<Record-Type>` Index (e.g. "ADR Index")

Shared template for every `<record-type>-index.md` registry (one row per record). Use it
for `adr-index.md`, `requirement-index.md`, `icr-index.md`, `contract-index.md`,
`learning-index.md`, and `epic-index.md`. Keep it concise — one line per record; full
detail lives in the individual record files.

This index is the **single source of truth for status**. Do not duplicate record status
across overview/process documents.

## Index

| ID | Title | Status | Record | Related | Notes |
| --- | --- | --- | --- | --- | --- |
| `<ID>` | `<short title>` | `<status>` | [`<ID>.md`](path/to/<ID>.md) | `<related record IDs or n/a>` | `<brief note>` |

### Per-record-type adjustments

Status values for every record type are defined in
`docs/governance/generic/process/artifact-model.md` — use those; do not invent others.
Structural notes:

- **`epic-index.md`** — add a **Priority** column and keep rows in priority order (it absorbs
  the prioritization the retired `product-backlog.md` once held).
- **`learning-index.md`** — add a **Category** column.
- **`requirement-index.md`** — `Related` lists ADR/epic references; IDs are `REQ-XY-YYNNNN`.
- **`icr-index.md` / `contract-index.md`** — `Related` links the requirement/ADR and the
  contract or interface affected; in `icr-index.md`, list `Open` requests first.

## Tracking Rules

1. Keep this index synchronized with its record folder contents.
2. Update status as records progress through their lifecycle.
3. Link related records (ADR / requirement / ICR / contract / epic) where relevant.
4. Never delete a row. On a terminal status, keep a tombstone link and move the row out of the
   live list — a "Superseded"/"Closed" section or a separate archived index — per
   `docs/governance/generic/process/artifact-model.md`.
5. Load on-demand when working with the relevant record type.
