# Software Project Instructions (Instantiation Template)

Use this file to instantiate project-specific instructions without redefining foundational policy.

## Source of Truth (Do Not Duplicate)

- Foundation policy and agent behavior: `docs/governance/generic/process/framework.md`
- Engineering depth (SOLID, taxonomy, verification): `docs/governance/generic/process/framework-reference.md`
- Record model, naming, indexing, archival: `docs/governance/generic/process/artifact-model.md`
- Epic/task planning policy: `docs/governance/generic/process/epic-process.md`
- Interface approval workflow template: `docs/governance/generic/templates/interface-change-request.template.md`

Rule: This file must contain project instantiation details only. Do not copy policy text from the source files above.

## 1. Project Profile

- Project name: `<name>`
- Governance version: `<e.g. v2.0.0 — the version adopted from docs/governance/CHANGELOG.md>`
- Goal: `<what this software must achieve>`
- Primary users: `<roles and expectations>`
- Constraints: `<regulatory, budget, timeline, operational>`

## 2. Architecture Instantiation

- Major modules and responsibilities: `<fill>`
- Module ownership map: `<fill>`
- Allowed dependency directions: `<fill>`
- Boundary contract catalog (API/schema/events/config): `<fill>`
- Behavior-oriented slicing plan (vertical slices by capability): `<fill>`

## 3. Interface Governance Instantiation

- Project-specific approval authority: `<who approves ICRs>`
- Required approval SLA: `<time expectations>`
- Contract versioning strategy: `<semantic versioning/compatibility policy>`
- ICR storage location: `<repo path or tracking system>`

All contract changes must use `docs/governance/generic/templates/interface-change-request.template.md`.

## 4. Verification Instantiation

- Critical end-to-end flows: `<fill>`
- Required boundary contracts to test: `<fill>`
- Integration points with highest failure risk: `<fill>`
- Component/service checks for fault localization: `<fill>`
- Optional unit-test focus areas (if needed): `<fill>`

## 5. Delivery Instantiation

- Branching constraints for this project: `<fill>`
- CI gates and blocking checks: `<fill>`
- Rollback strategy by release type: `<fill>`
- Observability minimum for release: `<fill>`

## 6. Quality Gate Instantiation

Requirement taxonomy and record naming follow `framework-reference.md` §2 and
`artifact-model.md` — do not restate them; record the project-specific decisions only:

- Requirement ID allocation: `<who assigns REQ-FR/QR/OR/CR records and the governance rule>`
- Portability acceptance checks: `<fill>`
- Maintainability acceptance checks: `<fill>`
- Observability acceptance checks: `<fill>`
- Contract-stability checks: `<fill>`
- Readability and documentation checks: `<fill>`

Code cohesion defaults (required unless explicitly overridden with rationale):

- File size guardrail: `<= 200 lines`.
- Function size guardrail: `<= 30 lines where practical`.

## 7. Stack Addendum

- Language and runtime: `<fill>`
- Frameworks and platform: `<fill>`
- Data/storage choices: `<fill>`
- Infrastructure/deployment model: `<fill>`

## 8. Evolution Tracking

Instantiate the artifact structure defined in `artifact-model.md`. Under
`docs/governance/project/evolution/`, create each durable-record folder with its index
(`adr/` + `adr-index.md`, `requirements/` + `requirement-index.md`, `icr/` + `icr-index.md`,
`contracts/` + `contract-index.md`), the `epics/` folder + `epic-index.md`, and `roadmap.md`.
Under `docs/governance/project/learnings/`, create the learnings folder + `learning-index.md`.
Use the templates in `docs/governance/generic/templates/`. Naming, the index-first rule, and
the archival lifecycle (superseded durable records → `superseded/` subfolders) all follow
`artifact-model.md` — do not restate them here.

Project-specific instantiation:

- Decision cadence: `<how often ADRs are created>`
- Review cadence for project instructions: `<how often to revisit section 8>`
- Epic ownership: `<who writes and maintains epics and their task checklists>`

## 9. Loading Matrix Instantiation

Tiers and budget guardrails follow `framework.md` §8 — do not restate them; name the
project-specific files per tier:

- Always-on (mandatory): `<docs/governance/README.md + concise architecture/quality policy files>`
- Usually referenced: `<tech stack / runtime profile; project-instructions scaffold; epic-process.md>`
- On-demand: `<requirements, roadmap and ADRs, epics, ICRs and contracts, learnings>`
