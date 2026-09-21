# Governance Artifact Model

How governance records are structured, named, indexed, and retired. Load this when creating,
filing, indexing, or archiving any record. Authority: subordinate to `framework.md`;
epic/task lifecycle detail lives in `epic-process.md`.

Templates live in `docs/governance/generic/templates/`; each record type's template is named below.

## Records and where they live

Instantiated governance lives under `docs/governance/project/evolution/` (learnings
excepted, below). Separate **durable records** and **durable knowledge** from **planning records**.

**Durable records** — kept permanently for audit; answer "what must hold" and "why". One file
per item, each with a `<record-type>-index.md` registry:
- `adr/` — architectural decisions (`ADR-YYNNNN.md`). Template: `adr.template.md`.
- `requirements/` — requirements (`REQ-XY-YYNNNN.md`, `XY ∈ {FR, QR, OR, CR}`); each file
  carries its own change history and traceability. Template: `requirement.template.md`.
- `contracts/` — boundary contracts (`<name>-contract.md`, named by the interface they
  govern). Template: `contract.template.md`.
- `icr/` — interface change requests (`ICR-YYNNNN.md`): the append-only audit log of proposed
  contract changes and their decisions. Template: `interface-change-request.template.md`.
  (Lifecycle differs from the standing rules — see Archival.)

**Durable knowledge** — `learnings/` under `docs/governance/project/learnings/`, one file per
learning (`LRN-YYNNNN-short-title.md`). Template: `learning.template.md`.

**Planning records** — epics and their inline tasks; scaffolding that closes when done and is
kept frozen for history, not maintained as a standing rule:
- **Epic** (`EPIC-YYNNNN.md` under `evolution/epics/`) — the primary planning unit and the
  level the human reviews; holds a brief, an inline task checklist, and links to the records
  it spawns. Template: `epic.template.md`. Replaces the retired "backlog item" / `BI-` model.
- **Tasks** — inline in the epic file (no per-task files); each task's substantive artifact is
  its code review in git/PR.

## Indexes

Every registry is `<record-type>-index.md` (singular prefix): `adr-index`, `requirement-index`,
`icr-index`, `contract-index`, `learning-index`, and `epic-index` (which also carries priority
ordering). Architecture-direction narrative lives in `roadmap.md` (see below; not an index).
Use the shared `index.template.md`. Each index file sits **beside** the folder it registers
(e.g. `adr-index.md` next to `adr/`), not inside it.

**Index-first** (see `framework.md` §8): load a record type's index before its records, then
open only the specific records it points to. Never bulk-load a record folder.

State lives in one place: epic state in `epic-index.md`, task states inline in the epic file,
record status in its own file and index — never duplicated across overview documents.

## Status values (canonical)

| Record | Active states | Terminal states |
| --- | --- | --- |
| ADR | `Proposed`, `Accepted` | `Superseded by <id>`, `Rejected`, `Withdrawn` |
| Requirement | `Proposed`, `Active` | `Superseded by <id>`, `Withdrawn` |
| Contract | `Proposed`, `Active` | `Superseded by <name>`, `Withdrawn` |
| ICR | `Open`, `Approved` | `Implemented`, `Rejected`, `Withdrawn` |
| Learning | `Active` | `Superseded by <id>` |
| Epic | `Ideation`, `Ready` | `Done` |
| Task | `To Do`, `In Review` | `Done` |

`Proposed → Active` (ADR: `Proposed → Accepted`) marks ratification: a requirement agreed as
binding; a contract confirmed by all parties — for a cross-service contract, when its `Open`
ICR is approved. A drafted-but-unratified rule stays `Proposed`, not `Active`. "Active" is about
agreement, not implementation — an agreed-but-unbuilt requirement is `Active` (build state lives
in epics).

## Archival / supersede

**Standing rules (ADR, requirement, contract)** are never deleted and IDs are never reused.
Why archive instead of delete: auditability — for governance, and for a billing/entitlement
authority especially, you must be able to prove *that* a rule once held and *why* it changed.
When a rule reaches a terminal status **and** no active record still references it:
1. Move the file into a `superseded/` subfolder beside its active records — e.g.
   `adr/ADR-260001.md` → `adr/superseded/ADR-260001.md`,
   `requirements/REQ-FR-260001.md` → `requirements/superseded/REQ-FR-260001.md`.
2. The live `<record-type>-index.md` keeps a one-line tombstone (ID, terminal status, link to
   the successor); move the full row to a "Superseded" section (or a separate archived index)
   so the live list stays short.
3. A `Superseded by <id>` record names its successor; the successor references what it
   replaced. Keep the reason for the terminal status in the record itself.

**ICRs** are an append-only audit log: never moved and never deleted. They progress
`Open → Approved → Implemented`; `Rejected` and `Withdrawn` are terminal exits. `icr-index.md`
tracks status and lists `Open` requests first. An approved ICR's effect lands in the contract
it modifies — the ICR records *why* the contract changed.

**Learnings** are marked `Superseded` (with `Superseded by <LRN-id>`) **in place** — never
moved; superseded learnings stay readable in the learning log.

**Epics** are never archived — a `Done` epic's brief is frozen in place; git history covers the rest.

## roadmap.md

An optional, living **architecture-direction narrative** — not an index and not a per-item
record. It holds the current architecture shape, the near-term direction, and the major
decisions still pending, with links to the ADRs that resolve them. Keep it short; when a
direction hardens into a decision, record the ADR and link it here.
