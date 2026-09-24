# Learnings Index

Registry of Liftrack's learning records (`learnings/LRN-YYNNNN-short-title.md`), one row per
record. Status values are defined in
[`artifact-model.md`](../generic/process/artifact-model.md) — this index is the **single
source of truth for each learning's status**; do not restate it in overview documents.

This index sits beside [`learnings/`](learnings/), which is durable knowledge and deliberately
kept outside `evolution/`.

**No learnings are recorded yet.** Liftrack has made no live call to the Crystord Engine, and its
first slice (EPIC-260007) captures what it learned at its implementation review, which is still
open. The table stays empty until then.

## Index

| ID | Title | Category | Status | Record | Related | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| _(no rows)_ | | | | | | |

## Tracking Rules

1. Keep this index synchronized with `learnings/`.
2. Update status as records progress through their lifecycle; a superseded learning is marked
   in place and stays readable.
3. Link related records (ADR / requirement / ICR / contract / epic) where relevant.
4. Never delete a row and never reuse an ID.
5. Load on-demand when a learning is recorded or consulted; open individual records only from
   this index.
6. Use the **Category** column for the area the learning came from (for example: backend
   contract, delivery, client data handling), so related lessons group without a full read.
