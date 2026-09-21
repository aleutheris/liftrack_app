# Requirement: REQ-XY-YYNNNN `<short title>`

Single requirement record. The ID encodes the class: `REQ-FR-…` (functional behavior),
`REQ-QR-…` (quality attribute), `REQ-OR-…` (operational), `REQ-CR-…` (constraint/compliance).
Status values: see `docs/governance/generic/process/artifact-model.md`.

- Requirement ID: `<REQ-XY-YYNNNN>`
- Title: `<short title>`
- Class: `FR | QR | OR | CR`
- Status: `Proposed | Active | Superseded by <id> | Withdrawn`
- Owner: `<who maintains this requirement>`

## Statement

`The system shall <observable, testable behavior or constraint>.`

## Rationale

`<why this requirement exists — the user outcome or obligation it serves>`

## Acceptance Criteria (behavioral)

- `<criterion 1 — verifiable by an end-to-end or contract check>`
- `<criterion 2>`

## Traceability

- Related ADRs: `<ADR refs or n/a>`
- Related epics: `<EPIC refs or n/a>`
- Related contracts / ICRs: `<refs or n/a>`

## Change History

| Date | Change | Rationale | Ref |
| --- | --- | --- | --- |
| `<yyyy-mm-dd>` | Added | `<why>` | `<epic / ICR / PR>` |
