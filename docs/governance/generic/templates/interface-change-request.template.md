# Interface Change Request (ICR)

Use this template for any interface or contract change that requires explicit human approval.

## 1. Request Metadata

- Request ID: `<ICR-YYNNNN>`
- Status: `Open | Approved | Rejected | Implemented | Withdrawn` (see `artifact-model.md`)
- Date: `<yyyy-mm-dd>`
- Requester: `<name or agent>`
- Affected contract(s): `<name>-contract.md`
- Priority: `<low|medium|high|critical>`

## 2. Contract Scope

Select all that apply:

- [ ] Public API
- [ ] Module/service interface
- [ ] Database schema contract
- [ ] Event/message contract
- [ ] External config/env contract

## 3. Current Contract

- Contract identifier: `<name/path/version>`
- Current behavior/signature: `<describe>`
- Current consumers: `<list known consumers>`

## 4. Proposed Change

- Proposed behavior/signature: `<describe>`
- Change type: `<additive|breaking|deprecating|removal>`
- Why current contract is insufficient: `<reason>`

## 5. Impact Analysis

- Technical impact: `<systems/modules affected>`
- Consumer impact: `<who must change>`
- Operational impact: `<deployment/runtime/support impact>`
- Risks: `<main failure modes>`

## 6. Compatibility Strategy

- Backward compatibility plan: `<versioning/adapter/feature-flag/etc>`
- Deprecation path: `<if applicable>`
- Sunset timeline: `<if applicable>`

## 7. Migration Plan

- Step-by-step migration: `<steps>`
- Validation checkpoints: `<checkpoints>`
- Rollback plan: `<clear rollback path>`

## 8. Verification Plan

- End-to-end behavior checks: `<required flows>`
- Contract/integration tests: `<required tests>`
- Observability checks: `<logs/metrics/traces to watch>`

## 9. Decision

- Decision: `<approved | rejected | needs changes>` (`needs changes` keeps Status `Open`;
  `approved` sets Status `Approved`, then `Implemented` once §10 is complete)
- Human approver: `<name>`
- Approval date: `<yyyy-mm-dd>`
- Notes: `<optional>`

## 10. Implementation Record

- Linked PR/changeset: `<link or id>`
- Release target: `<version/milestone>`
- Post-release review date: `<yyyy-mm-dd or n/a>`
