# Governance Changelog

Release notes for the **shared governance model** that projects copy from `projecter`. When
a project pulls a newer version of this governance, read the entries between its current
version and the target version — they describe what changed and how to migrate, the same way
a software release note does.

**Versioning.** `MAJOR.MINOR.PATCH`:
- **MAJOR** — breaking changes to layout, terminology, or record model; a project must
  migrate (move files, rename records, retire concepts).
- **MINOR** — additive changes (new templates, new optional records) that don't break an
  existing project.
- **PATCH** — clarifications, wording, and fixes with no structural impact.

A project should record which governance version it is on (e.g. in
`docs/governance/project/project-instructions.md`) so upgrades are unambiguous.

---

## v2.0.0 — 2026-06-24 — Tool-neutral governance + epic model

Major restructure. Governance is no longer tied to GitHub/Copilot, and the planning tier
moves from "backlog items" to an **epic + task** model. **Projects on v1.x must migrate.**

### Added
- `docs/governance/README.md` — neutral entry/router (purpose, scope routing, loading
  triggers), readable by humans and any AI tool.
- Thin-pointer entry points: root `CLAUDE.md` and `.github/copilot-instructions.md` now only
  redirect into `docs/governance/`.
- `generic/process/epic-process.md` — epic/task lifecycle, states, and prioritization.
- `generic/process/artifact-model.md` — record structure, naming, indexing, and the archival lifecycle.
- `generic/templates/epic.template.md` — epic brief + ideation bullets + inline task table.
- `generic/templates/index.template.md` — one shared template for every
  `<record-type>-index.md` registry.
- `generic/templates/requirement.template.md` and `generic/templates/contract.template.md` —
  record templates for the two durable records that previously had none.

### Changed
- **Location:** all governance moved from `.github/` to `docs/governance/`. Every internal
  `.github/…` path reference was rewritten to `docs/governance/…`.
- **Planning model:** "backlog item" (`BI-`) retired in favor of **Epic** (`EPIC-YYNNNN`).
  An epic owns a brief, an **inline task checklist** (no per-task files), and links to the
  durable records it spawns.
- **Epic states:** `Ideation → Ready → Done` (coding starts only at Ready = plan-review
  gate; Done = implementation-review gate). **Task states:** `To Do → In Review → Done`,
  every task gets a code review, and each epic must include ≥1 task dedicated to coverage.
- **Index naming convention:** every registry is now `<record-type>-index.md` (singular
  prefix). The six indexes: `adr-index`, `requirement-index`, `icr-index`, `contract-index`,
  `learning-index`, `epic-index` (the epic index also carries priority ordering).
- **Record-category split** made explicit: ADR / requirement / ICR / contract are durable
  records, learnings are durable knowledge, and epics and tasks are planning records (kept
  frozen when done).
- **Archival:** standing rules (ADR/requirement/contract) move to a `superseded/` subfolder on
  a terminal status, with a tombstone in the live index; ICRs are an append-only audit log
  (`Open → Approved → Implemented`; `Rejected`/`Withdrawn` terminal); learnings are marked
  `Superseded` in place.
  Per-record status sets are defined canonically in `artifact-model.md`.
- **`Proposed` pre-active state for requirements and contracts** (matching ADR's `Proposed`):
  a drafted-but-not-yet-ratified rule is `Proposed`, becoming `Active` on ratification — so an
  unconfirmed cross-service contract is no longer mislabeled `Active`.
- **Loading optimization:** the always-on core was shrunk to principles + behavior + scope
  routing. Record structure, naming, and archival moved out of `framework.md` §7 into
  `artifact-model.md`; collaboration/communication and escalation behavior live in
  `framework.md` §2; `framework-reference.md` is now pure engineering depth (SOLID, taxonomy,
  verification, quality gates).
- **Index-first loading rule** (`framework.md` §8): load a `<record-type>-index.md` before its
  records; never bulk-load a record folder.
- **Claude pinning:** `CLAUDE.md` now `@`-imports the always-on core (`README.md` +
  `framework.md`) so Claude auto-loads it; all other tiers load on demand.

### Removed
- `generic/process/product-backlog.md` → reworked into `epic-process.md`.
- `generic/templates/backlog-item.template.md` → replaced by `epic.template.md`.
- `generic/templates/backlog-status-template.md`,
  `generic/templates/requirements-log-template.md`, and
  `generic/templates/learnings-index-template.md` → consolidated into `index.template.md`.
- `generic/process/llm-software-execution.md` → folded into `framework.md` §2 (collaboration/escalation).
- The Copilot-specific framing and the bespoke `meta`/`target` scope vocabulary; replaced by
  the neutral `generic instructions` / `project instructions` / `code` routing.

### How to upgrade a project from v1.x
1. Create `docs/governance/`. Move `.github/generic/` → `docs/governance/generic/`, and turn
   `.github/copilot-instructions.md` into the neutral `docs/governance/README.md` router.
2. Add thin pointers: `CLAUDE.md` and `.github/copilot-instructions.md` redirecting to
   `docs/governance/README.md`. Rewrite every `.github/…` reference to `docs/governance/…`.
3. Adopt the new generic files/templates (artifact-model, epic-process, epic.template,
   index.template), fold any `llm-software-execution.md` content into `framework.md` §2, and
   `@`-import the always-on core (`README.md` + `framework.md`) from `CLAUDE.md`; retire the
   removed ones.
4. Convert each `BI-*` item to an `EPIC-*` (add ideation bullets + an inline task list, incl.
   a coverage task).
5. Rename project indexes: `requirements-index.md` → `requirement-index.md`,
   `backlog-status.md` → `epic-index.md` (add a priority column), `learnings/index.md` →
   `learning-index.md`. Split `design-plan.md` into `adr-index.md` + `roadmap.md`. Create
   `icr-index.md` and `contract-index.md`.
6. Delete the project `product-backlog.md`; its priority ordering moves into `epic-index.md`.
7. Apply the archival lifecycle: standing rules (ADR/requirement/contract) move to a
   `superseded/` subfolder on a terminal status, with a tombstone in the live index; ICRs are
   an append-only log; learnings are marked `Superseded` in place; epics are never archived.

---

## v1.0.0 — 2026-04-07 — Copilot-bound governance (initial)

The original governance model.

- Lived under `.github/`, framed as GitHub Copilot instructions: root
  `copilot-instructions.md` + `.github/copilot-instructions.md` (meta governance) +
  `.github/generic/{process,templates}/`.
- Scope routing used a `meta` / `target` vocabulary.
- Planning tier was the **backlog item** (`BI-YYNNNN`), with a `product-backlog.md`
  narrative and a `backlog-status.md` tracker.
- Durable records: ADR, requirement (`REQ-XY-YYNNNN`), ICR, contract, learning.
- Indexes were named inconsistently (`requirements-index.md`, `backlog-status.md`,
  `requirements-log-template.md`, `design-plan.md`, `learnings/index.md`).
