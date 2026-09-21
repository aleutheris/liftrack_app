# Contract: `<name>-contract` `<short title>`

A boundary contract — the standing agreement at an interface (API, service interface, schema,
event, or config). Changes to it require an ICR (`framework.md` §3). Status values: see
`docs/governance/generic/process/artifact-model.md`.

- Contract file: `<name>-contract.md`
- Status: `Proposed | Active | Superseded by <name> | Withdrawn` (`<name>` = the successor contract)
- Type: `API | service interface | database schema | event/message | external config`
- Owner: `<who owns this boundary>`

## Interface Governed

`<the interface this contract defines — endpoint / module surface / schema / event>`

## Provider and Consumers

- Provider: `<service/module that owns the interface>`
- Consumers: `<known consumers that depend on it>`

## Contract Definition

`<signature / schema / message shape / config keys, plus the semantics and invariants that must hold>`

## Compatibility and Versioning

- Versioning strategy: `<semver / compatibility policy>`
- Backward-compatibility guarantees: `<what consumers can rely on>`

## Verification

- Contract / integration tests: `<the checks that prove the contract holds at the boundary>`

## Traceability

- Related requirements: `<REQ refs or n/a>`
- Related ADRs: `<ADR refs or n/a>`
- Change requests (ICRs): `<ICR refs or n/a>`
