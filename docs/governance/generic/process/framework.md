# Software Project Instruction Framework (Abstract)

This framework is the canonical, always-on authority. It stays principle-level; deeper detail
lives in `framework-reference.md` (engineering depth) and `artifact-model.md` (record model).

## 1. Scope

- Keep this file principle-level and stable.
- Put concrete stack, runtime, and project-shape details under `docs/governance/project/`.

## 2. Operating Values and Collaboration

Non-negotiable values:
- Human readability over cleverness.
- Stable contracts over local optimization.
- Small, reversible changes over risky rewrites.
- Observable behavior over assumptions.
- Long-term maintainability over short-term speed.
- Human oversight over autonomous drift.

Collaboration and communication:
- Optimize for truth and quality, not agreement.
- Challenge weak assumptions with concise, evidence-based reasoning; propose at least one
  safer alternative when pushing back.
- Distinguish facts, assumptions, and recommendations; avoid authority claims without
  verification signals.
- Challenge solution-first requests that lack a clear user outcome or success metric.
- Be direct and specific; avoid flattery and performative certainty.
- State file-level and behavior-level impact when proposing changes.
- Prioritize behavior correctness over elegance, and tie proposals to epic outcomes where one applies.

Require explicit human review for API/interface contract changes (which follow the ICR
workflow, §3), schema and data-migration risk, security-sensitive changes, and broad
architecture changes. Before recommending, check:
values aligned, tradeoffs explicit, risks and rollback clear, verification defined, and
approval requested where governance requires it.

## 3. Architectural Governance

### Module Boundaries

- Treat each module as an autonomous unit with explicit responsibilities.
- Keep orchestration explicit and prevent leaky abstractions.
- Prefer behavior-oriented architecture (vertical slices by capability) over broad technical buckets.

### Interface Change Control

The LLM has no authority to change interfaces without explicit human approval.
This applies to public APIs, service/module interfaces, database schema contracts, event contracts, and external configuration contracts.

Required workflow:
1. Propose an Interface Change Request (ICR).
2. Include impact analysis, compatibility strategy, and migration plan.
3. Wait for explicit approval.
4. Then implement and validate.

## 4. Design and Quality Heuristics

Use SOLID and clean code principles as heuristics, not dogma (detail in `framework-reference.md` §1).

- Keep files cohesive; `<= 200` lines unless justified.
- Keep functions focused; `<= 30` lines where practical.

## 5. Verification and Delivery

Quality is validated by behavior, not by test count.

- Use end-to-end and boundary contract checks as primary verification; component/service and
  unit checks to localize failures. The full testing ladder is in `framework-reference.md` §3.
- Prefer short-lived branches, small commits, and frequent integration.
- Remove dead code and unnecessary complexity when safe.

## 6. Acceptance Gates

Define concrete acceptance checks for portability, maintainability, observability, contract
stability, readability, and requirement-taxonomy clarity (classes `FR`/`QR`/`OR`/`CR`; the
record IDs are always `REQ-XY-YYNNNN`). Taxonomy and quality-gate detail: `framework-reference.md` §2 and §4.

## 7. Governance Artifact Model (summary)

Governance records are **durable** (ADR, requirement, ICR, contract), **durable knowledge**
(learnings), or **planning records** (epics + their inline tasks — they close when done and are
kept frozen for history, not maintained as standing rules). One file per item, each with a
`<record-type>-index.md` registry. Superseded standing rules (ADR/requirement/contract) move
to a `superseded/` subfolder; ICRs are an append-only log; learnings are marked superseded in
place; epics are never archived. Full structure, naming, indexing, status, and archival rules:
`artifact-model.md`. Epic/task lifecycle: `epic-process.md`.

## 8. Context Budget and Loading Policy

Loading tiers (only tier 1 is auto-loaded — on Claude, via the `@`-imports in `CLAUDE.md`;
with other tools, open the tier-1 files first. Tiers 2–3 load on the router's triggers):
1. **Always-on**: the concise, high-authority core (`docs/governance/README.md`, this file).
2. **Usually referenced**: the project-shaping files most non-trivial design/governance tasks
   reach for first — loaded on demand, not preloaded.
3. **On-demand**: large or fast-changing artifacts loaded only when a specific trigger applies.

Budget guardrails:
- `docs/governance/README.md` target: `<= 120` lines.
- Each always-on companion file target: `<= 120` lines.
- Split on-demand files when they exceed ~400 lines or become review bottlenecks.

Duplication rule: keep one source of truth per concern; always-on files summarize and reference, never copy detailed policy blocks.

Index-first rule: to work with a record type, load its `<record-type>-index.md` first, then open only the specific records it points to. Never bulk-load a record folder.

Loading defaults:
- **Always-on**: `docs/governance/README.md`, `docs/governance/generic/process/framework.md`
- **Usually referenced**: `framework-reference.md`, `artifact-model.md`, `project-instructions.md`, `epic-process.md`
- **On-demand**: templates, evolution artifacts (epics, ADRs, requirements, ICRs, contracts), and learnings

Template rule: files under `docs/governance/generic/templates/` are never loaded automatically — load one only when a task requires creating or filling it out.
