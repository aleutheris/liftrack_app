# Software Project Instruction Framework (Reference)

Technical-depth companion to `framework.md`: design heuristics, the canonical requirement
taxonomy, verification, and quality-gate detail. Authority: lower than `framework.md` — if
anything here conflicts, the framework wins; report it and propose an aligned fix. Load for
design review, architecture tradeoffs, and verification planning.

(Record structure, naming, indexing, and archival live in `artifact-model.md`; collaboration
and escalation behavior live in `framework.md` §2.)

## 1. SOLID Heuristic Detail

| Principle | Expected Behavior | Verification Signal |
| --- | --- | --- |
| SRP | Keep one reason to change per module/class | Cohesion review and change-scope analysis |
| OCP | Prefer extension paths over risky core rewrites | Diff review and extension points |
| LSP | Subtypes preserve expected behavior contracts | Contract tests across implementations |
| ISP | Avoid forcing consumers to depend on unused methods | Interface surface review |
| DIP | Depend on abstractions, not concrete details | Dependency direction checks |

## 2. Requirements Taxonomy (canonical)

- Functional behavior requirements: `FR-*`
- Quality attribute requirements: `QR-*`
- Operational requirements: `OR-*`
- Constraint/compliance requirements: `CR-*`

Canonical requirement record names encode the class as `REQ-FR-YYNNNN`, `REQ-QR-YYNNNN`,
`REQ-OR-YYNNNN`, or `REQ-CR-YYNNNN`. Use the class-prefixed ID as the stable reference inside
epics, requirement records, and implementation artifacts. Avoid the generic term
"non-functional requirements"; use the explicit classes.

## 3. Verification Planning (canonical)

Testing priority ladder:
1. Required: end-to-end behavior tests for critical user flows.
2. Required: contract and integration tests at boundaries.
3. Recommended: focused component/service tests for fault localization.
4. Optional: unit tests for complex or high-risk internal logic.

Rule: if behavior tests fail, use lower-level tests to isolate the failure quickly.

## 4. Quality Gate Detail

Use these deeper checks during architecture/design review:
- Portability: build and run in intended targets without hidden assumptions.
- Maintainability: clear ownership boundaries and low-friction change paths.
- Observability: logs, metrics, and traces diagnose critical flows.
- Contract stability: no unapproved interface changes.
- Readability: code and docs understandable with minimal context switching.
