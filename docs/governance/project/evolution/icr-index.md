# ICR Index

Registry of Liftrack's interface change requests (`icr/ICR-YYNNNN.md`), one row per record,
`Open` requests first. Status values are defined in
[`artifact-model.md`](../../generic/process/artifact-model.md) — this index is the **single
source of truth for each request's status**; do not restate it in overview documents.

**Every request below is raised by Liftrack as a *consumer* of the Crystord Engine GraphQL
boundary, and Liftrack cannot decide any of them.** The interface belongs to the Crystord
Engine project; its project owner is the decision authority, and an approval is recorded in
that project's own ICR log. These records exist so that Liftrack's asks are argued, costed and
auditable on the consumer side — what it needs, why today's contract cannot give it, what it
does in the meantime, and how the workaround is removed when the ask lands. Both are
`Open`: filed as drafts, neither submitted to or decided by the engine's owner.

They are sequenced deliberately (see each record's §7): the documentation half of ICR-260001
first, because it costs the engine one paragraph and no schema text; then ICR-260003 while the
engine's own request is still undecided, because its whole value is being timely; then
ICR-260001's signal half, once the cheap client-side workaround has shown whether it is
genuinely needed. A third candidate — batch retrieval by UUID set — was considered and not
filed: the atom shape denormalises what each screen needs, so the capability is not required
(see ADR-260006's Decision and `liftrack-atom-shape-contract.md` §4).

**Overlap with Crystord Engine ICR-260024.** The engine has its own filed-but-undecided request
(`ICR-260024`, filed 2026-09-08, schema `9.3.0` → `9.4.0`, additive/MINOR, recorded as
`pending` in the engine's index) that already proposes atom timestamps, `created`/`updated`
range filters, a whitelisted `sort`, and client-reachable `limit`/`offset`. Liftrack must not
re-propose any of that; where the two touch, the rows below say exactly which part is already
upstream and which part is Liftrack's own. Nothing in it may be treated as agreed — it is a
proposal in another project, awaiting that project owner's decision. Foreign IDs are qualified
as "engine ICR-…" throughout; they are not records in this index.

## Index

| ID | Title | Status | Record | Related | Notes |
| --- | --- | --- | --- | --- | --- |
| `ICR-260001` | Make `retrieve` result bounds reachable and truncation detectable | `Open` | [`ICR-260001.md`](icr/ICR-260001.md) | Interface: `crystord-graphql-contract.md` (`Query.retrieve`); REQ-CR-260003, ADR-260006; EPIC-260006 | Two asks, split by cost. **Documentation half (high priority, zero cost):** the published guide documents `listLabels`' 25-item cap and its missing truncation flag, but documents no cap for `retrieve` at all — so the default 25 (`inter_fundamentals.py:1406-1407`, applied `:1419`) reaches clients as silent data loss. One paragraph, no schema text, no version bump. **Signal half (medium):** a client cannot distinguish 25 rows from 25-of-800; asks for a sibling count over the same predicate. **Reachability is *not* asked for here** — engine ICR-260024 already proposes client-reachable `limit`/`offset`, and duplicating it would waste the engine's time. |
| `ICR-260003` | Atom timestamps and temporal filtering for session-by-date reads | `Open` | [`ICR-260003.md`](icr/ICR-260003.md) | Interface: `crystord-graphql-contract.md` (`Query.retrieve`, `AtomOutput`); REQ-FR-260005, REQ-CR-260003, ADR-260006, ADR-260001; EPIC-260006 | **A consumer endorsement of engine ICR-260024, not a rival proposal — it asks for no new interface shape.** `AtomOutput` carries no timestamp while workspace, dimension and value outputs all do, so "the session for 2026-09-12" is not expressible server-side. Liftrack's contribution is being a named consumer in that request's impact table before it is decided, plus the acceptance criteria it will verify. It also records the limit of the value claim: a created timestamp is record-time, not the date the workout happened, so Liftrack keeps the workout date as its own data and asks the engine for no domain event-time. |

No request has been submitted to or decided by the Crystord Engine project owner.

## Tracking Rules

1. Keep this index synchronized with `icr/`, and keep `Open` requests listed first.
2. Update status as requests progress through their lifecycle; record the deciding authority
   and the date in the record's own Decision section, not here.
3. Link the contract or interface affected and the related requirement / ADR / epic.
4. Load on-demand when working with ICRs; open individual records only from this index.
