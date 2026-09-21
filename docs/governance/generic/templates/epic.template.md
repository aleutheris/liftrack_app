# Epic Template

Use this template for an epic — the primary planning unit. Lifecycle, states, and
prioritization are defined in `docs/governance/generic/process/epic-process.md`.

The **epic state** is tracked in `epic-index.md`; **task states** live in the inline checklist
below. The epic brief here is the stable record of intent.

- Epic ID: `<EPIC-YYNNNN>`
- Title: `<short value-oriented title>`
- Persona/Actor: `<who benefits>`
- Value statement: `For <persona>, deliver <capability> to achieve <outcome>.`
- Context: `<where and when this problem happens>`
- Problem statement: `<what pain/risk exists now>`
- Expected outcome: `<observable user/business outcome>`
- Success metric(s): `<how success is measured>`
- Non-goals: `<what is explicitly out of scope>`
- Constraints: `<legal, operational, technical, timeline>`
- Dependencies: `<other epics, systems, approvals>`
- Risks/assumptions: `<key risks or unknowns>`
- Target window: `<sprint/release>`
- Validation approach: `<e2e behavior checks, contract checks, telemetry>`

(Priority score and ordering live in `epic-index.md`, not here — see `epic-process.md`.)

## Ideation Bullets

Open points that must be discussed and resolved before the epic becomes Ready. Each
resolved bullet becomes the foundation of one or more tasks.

- [ ] `<bullet to resolve>`
- [ ] `<bullet to resolve>`

## Tasks

Defined only once the epic is Ready. Inline checklist — no per-task files. Each task's
substantive artifact is its code review in git/PR. Include at least one task dedicated to
coverage. Task state: `To Do → In Review → Done`.

| Task | State | Commit/PR/Review |
| --- | --- | --- |
| `<task description>` | To Do | `<link or n/a>` |
| `<task description>` | To Do | `<link or n/a>` |
| Full code + test coverage for this epic | To Do | `<link or n/a>` |

## Links (durable records spawned)

- Requirements: `<REQ-FR-YYNNNN.md | REQ-QR-YYNNNN.md | REQ-OR-YYNNNN.md | REQ-CR-YYNNNN.md | n/a>`
- ADRs: `<adr reference or n/a>`
- ICRs: `<icr reference or n/a>`
- Contracts: `<contract reference or n/a>`
