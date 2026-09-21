# Liftrack — Project Instructions (Instantiation)

Instantiated from `docs/governance/generic/process/project-instructions.md`. This file holds
project instantiation details only; foundational policy lives in the generic governance tree
(do not duplicate it here).

> **Ratification note (2026-09-21).** Liftrack is greenfield: no application code, no scaffold and
> no package manifest exist. Three ADRs are accepted — the workout domain model (ADR-260001), the
> frontend stack (ADR-260007) and the first slice's content source (ADR-260008); every other record is unratified, and the indexes hold each status.
> The six original epics are parked, and the first slice is EPIC-260007 (`evolution/epic-index.md`).
> Sections 2 and 5 below describe the **intended** instantiation, not a built one, and name the ADR
> whose acceptance would make them binding; §7 marks which of its lines are decided.

## Source of Truth (Do Not Duplicate)

- Foundation policy and agent behavior: `docs/governance/generic/process/framework.md`
- Engineering depth (SOLID, taxonomy, verification): `docs/governance/generic/process/framework-reference.md`
- Record model, naming, indexing, archival: `docs/governance/generic/process/artifact-model.md`
- Epic/task planning policy: `docs/governance/generic/process/epic-process.md`
- Interface approval workflow template: `docs/governance/generic/templates/interface-change-request.template.md`

Rule: This file must contain project instantiation details only. Do not copy policy text from the
source files above.

## 1. Project Profile

- Project name: `Liftrack`
- Governance version: `v2.0.0` (adopted from `docs/governance/CHANGELOG.md`)
- Goal: a web app that tells a lifter, on the day, which exercises to perform and how many **sets**
  and reps of each — all planned upfront — and records what was actually done: the sets performed,
  the reps in each, and the weight used per set. Persistence is the Crystord Engine GraphQL API;
  Liftrack owns no server and no database of its own.
- Primary users: **one lifter, following a pre-planned programme**, using a phone at the gym —
  one-handed, between sets, on an unreliable network, and often after a long idle gap. Plan
  authoring happens off the gym floor, by the same person. There is no coach, no trainee and no
  second account in MVP.
- Constraints:
  - **Static hosting on GitHub Pages** — no server runtime, no request-time environment, no
    response-header control, and a world-readable bundle. Configuration is build-time
    (REQ-OR-260001, ADR-260002).
  - **Online-only MVP** — no offline store, no write queue, no sync or conflict handling; a set is
    not logged until its mutation returns (ADR-260003).
  - **Consumes a contract Liftrack has no authority over** — the Crystord Engine GraphQL API,
    vendored as evidence in `docs/backend/` at schema `9.3.0`. Liftrack may request changes; it
    cannot make them (REQ-CR-260001, `evolution/contracts/crystord-graphql-contract.md`).
  - **The backend is actively evolving.** Backend ICR-260024 (`pending` upstream, not approved)
    would take the schema to `9.4.0`. Liftrack must work correctly on `9.3.0` as it stands while
    keeping every workaround thin and removable (ADR-260006).
  - **Little is agreed.** The domain mapping (ADR-260001), the stack (ADR-260007) and the first
    slice's content source (ADR-260008) are decided; the hosting target and the token policy are
    still open questions put to the repository owner.

## 2. Architecture Instantiation

No code exists. The following is the intended instantiation — the shape ADR-260002 would ratify and
EPIC-260002 would build — recorded here so the first commit has a boundary to land inside rather
than a structure discovered afterwards.

- Major modules and responsibilities: `app-shell` (routing, layout, the boot-time schema handshake,
  the global re-auth interrupt); `session-access` (sign-in, sign-out, token lifecycle —
  REQ-FR-260001); `plan-authoring` (upfront programme authoring: exercises, sets, rep targets —
  REQ-FR-260002); `today-workout` (what to do today and per-set logging of reps and weight —
  REQ-FR-260003, REQ-FR-260004); `backend-adapter` (the single seam onto the Crystord GraphQL
  boundary — see below); `ui-primitives` (shared, typed, project-agnostic presentation elements).
- Module ownership map: the repository owner owns every module. No ownership split is planned
  before MVP; if one is introduced later it follows the module boundary, not the file tree.
- Allowed dependency directions: `app-shell` composes feature slices; a feature slice may depend on
  `backend-adapter`, `ui-primitives` and shared leaf utilities; **a feature slice must never import
  another feature slice's internals**; `backend-adapter` must not import any feature slice;
  `ui-primitives` imports nothing project-specific and must not know the domain.
- Boundary contract catalog: `evolution/contracts/crystord-graphql-contract.md` (the external
  GraphQL API boundary, pinned to a schema range); `evolution/contracts/liftrack-atom-shape-contract.md`
  (the data shape Liftrack writes into atoms, which ADR-260001 would ratify); the build-time
  configuration contract (backend endpoint + pinned schema range + build identifier, per ADR-260002);
  and `ui-primitives` prop contracts.
- Behavior-oriented slicing plan: one vertical slice per thing the lifter does — get in, plan,
  train, log. Within a slice, behavior lives in hooks/services and components stay presentational,
  so a slice can be tested through its behavior without mounting its UI.
- **Backend-adapter seam (the load-bearing boundary).** Every accommodation for what the backend
  cannot do today lives in `backend-adapter` and nowhere else: the silent 25-row `retrieve` page
  cap and its truncation detection (REQ-CR-260003), the absence of batch read by UUID set, the
  absence of atom timestamps and any temporal filter, the encode/decode of positional list rows,
  and the extraction of error codes from the GraphQL `message` string. Feature slices speak in
  domain terms — plans, sessions, exercises, sets — and never in atoms, labels or selectors. This
  seam is what makes ADR-260006's "thin and removable" **checkable**: when the backend gains a
  capability, the workaround's removal must touch `backend-adapter` only. A workaround that leaks
  into a feature slice is a governance defect, not a style preference.
- **Interim content source (first slice, ADR-260008 — `Accepted`).** Until the backend arrives,
  `today-workout` reads through the same domain-level source interface `backend-adapter` will
  implement, served by a file-backed source over the repository's `content/` folder. It occupies
  the adapter's seam and nothing else: when the adapter lands, the file-backed source is deleted and
  the slice does not change.

## 3. Interface Governance Instantiation

- Project-specific approval authority: **Repository owner**, for every contract Liftrack owns.
- Required approval SLA: target 48 hours for a decision on a Liftrack-owned ICR. **No SLA applies to
  requests raised against the Crystord boundary** — those are decided by the backend project on its
  own cadence, and Liftrack must plan as though any one of them is never granted.
- Contract versioning strategy: the external boundary is pinned by semantic-version range against
  the live `schemaInfo.schemaVersion`, verified at boot before any data call (ADR-260004 proposes
  `^9.3.0`, deliberately not `~9.3.0`). Internal shapes are versioned in-band: every atom Liftrack
  writes carries an explicit schema tag so a reader can support two shapes at once rather than
  migrate a corpus the backend cannot help it migrate (ADR-260001).
- ICR storage location: `docs/governance/project/evolution/icr/`

**Two-sided reality — read this before filing anything.** Liftrack's ICR log holds two different
kinds of record and they are not interchangeable:

- **Liftrack-owned contracts** — the atom-shape contract, the build-time configuration contract, and
  module interfaces. Here the ICR workflow runs to completion inside this repository and the
  repository owner's approval is the decision.
- **The Crystord boundary** — `crystord-graphql-contract.md` describes an interface Liftrack
  consumes and does not own. An ICR against it is a **request to be raised with the backend
  project**, not a change Liftrack can approve. ICR-260001 and ICR-260003 are exactly that: they
  are filed here as the durable record of what Liftrack would ask for, why, and what it does
  meanwhile — drafted, not yet submitted to `crystord_engine` for its owner's decision. A status beyond `Open`
  on such a record reflects the **backend project's** decision, and Liftrack must never record one
  it has not been given.

All contract changes must use `docs/governance/generic/templates/interface-change-request.template.md`.

## 4. Verification Instantiation

- Critical end-to-end flows: (1) **sign in** and reach the day's workout, including recovery when
  the session has expired during a long idle gap; (2) **see today's plan** — which exercises, how
  many sets, how many reps, as planned upfront; (3) **log every set of an exercise** with its reps
  and its weight, each one confirmed persisted before it is shown as saved; (4) **data survives a
  reload** — closing the tab mid-workout and reopening returns every set already saved
  (REQ-FR-260005; cross-device read-back is explicitly *not* an MVP commitment — ADR-260003,
  `roadmap.md` "Deliberately deferred").
- Required boundary contracts to test: the Crystord GraphQL boundary against a live deployment's
  `schemaInfo` (version in the pinned range, and the handshake blocking data calls until it
  passes); the Liftrack atom-shape contract by write-then-read-back, asserting the decoded set
  table is equal to what was submitted, including its column order; the build-time configuration
  contract (a build must fail without an endpoint and a pinned range).
- Integration points with highest failure risk:
  1. **Silent truncation** — `retrieve` returns at most 25 atoms with no flag, no count and no error
     (`crystord/atom_interactions/inter_fundamentals.py:1406-1407`, applied at `:1419`; the
     resolver never forwards a limit, `crystord_server/resolvers.py:86-91`). REQ-CR-260003 must be
     provable, not asserted: seed more atoms under one label than a page holds, then assert the
     client reports the result as incomplete rather than presenting it as the whole set.
  2. **Session expiry mid-workout** — with no write queue, an expiry between entering a weight and
     saving it loses the entry. The re-auth path must be non-destructive to in-memory input, and
     nothing may be displayed as saved before its mutation returns.
  3. **The schema handshake and the pin range** — the failure state a Pages bundle cannot heal
     itself out of; it must be distinguishable in the UI from "backend unreachable" and "offline".
  4. **Positional list encode/decode** — the server validates nothing inside list content, so the
     column contract is Liftrack's alone to keep and its round trip is the only place it is proven.
  5. **First deploy** — HTTPS endpoint, CORS, base path and any Google origin registration all fail
     for the first time on deploy day if they are not checked before it.
- Component/service checks for fault localization: `backend-adapter` request builders and response
  decoders, the truncation detector, the error-code extractor, the compatibility verdict, and each
  feature slice's behavior layer driven without its UI.
- Optional unit-test focus areas: the pure encoders and decoders (set table, date encoding), the
  semver verdict function, and any validation that mirrors a documented backend rule.

## 5. Delivery Instantiation

**No CI, no pipeline and no deployment exist today.** The following is the target that ADR-260002
would ratify and EPIC-260002 would build; it is written as a target so the first pipeline is
reviewed against a recorded intent. The first pipeline is a reduced one, built by EPIC-260007: lint,
type check, tests, build and deploy, with no backend configuration. The backend-facing gates below
stay with EPIC-260002.

- Branching constraints for this project: direct-to-main with small, reversible commits
  (single-maintainer project); `main` must remain deployable at all times, because rollback is a
  rebuild (below).
- CI gates and blocking checks: lint; strict type checking; the unit/component suite; the boundary
  checks in §4; a deploy guard that asserts the **positive** condition that the configured endpoint
  begins with `https://` (never a blocklist of known-bad hosts, which passes any unlisted plaintext
  host); a check that the pinned schema range admits the version the live backend currently
  reports; and a build that fails outright if the generated configuration lacks an endpoint or a
  pinned range.
- Rollback strategy by release type: a Pages deploy **replaces the whole site** and deletes the
  previous build's content-hashed assets, so there is no per-version rollback switch — rollback is
  redeploying the last known-good commit, which is a rebuild. Consequences to design for: keep a
  single bundle in MVP rather than route-split chunks, so a cached `index.html` cannot reference a
  chunk that no longer exists; stamp a build identifier (commit and build time) into the bundle;
  verify the restored build against flow (1) of §4 before calling the rollback complete.
- Observability minimum for release: GitHub Pages provides **no access logs of any kind**, so the
  user-visible error surface is the primary observability channel, not a fallback. Every blocking
  failure state must name the backend schema version, the endpoint host and the build identifier,
  so a screenshot from the gym floor is actionable. Structured console logging supports it.
  Third-party telemetry is an explicit non-goal for MVP (REQ-OR-260002).

## 6. Quality Gate Instantiation

Requirement taxonomy and record naming follow `framework-reference.md` §2 and `artifact-model.md`
— record the project-specific decisions only:

- Requirement ID allocation: the repository owner assigns `REQ-FR/QR/OR/CR` IDs from the project's
  single shared `26xxxx` sequence (shared with ADR, EPIC and ICR numbering); the record file and its
  row in `evolution/requirement-index.md` are created in the same change, index first.
- Portability acceptance checks: runs in current mobile Safari and Chrome on a phone at the widths
  REQ-QR-260001 states; no server runtime of any kind; the endpoint and the pinned schema range come
  from build-time configuration and appear in no component.
- Maintainability acceptance checks: the guardrails below; every backend accommodation confined to
  `backend-adapter`; every positional column contract documented at the point it is encoded.
- Observability acceptance checks: each critical flow's failure state produces a user-visible
  diagnostic carrying schema version, endpoint host and build identifier — console-only is not a
  pass, because the user is on a phone.
- Contract-stability checks: the `schemaInfo` handshake precedes every data call; a release is
  blocked when the pinned range does not admit the live version; a change to the atom shape is a
  contract change and needs its ICR before it is written.
- Readability and documentation checks: no dead code, no unused imports, meaningful naming, and no
  backend workaround without a comment naming the ADR or ICR that governs its removal.

Code cohesion defaults (required unless explicitly overridden with rationale):

- File size guardrail: `<= 200 lines`.
- Function size guardrail: `<= 30 lines where practical`.

## 7. Stack Addendum

The owner's stated position was a **non-preference with one hard constraint**: *"I do not actually
care [about the stack], as long as it can be used in github pages."* GitHub Pages therefore sets the
boundary: static files only, no server runtime, no request-time environment, no control of response
headers, and a publicly readable build output. On 2026-09-21 the owner chose the stack —
**ADR-260007, `Accepted`**. Lines marked *proposed* below are still recommendations, pending the ADR
each names.

- Language and runtime (decided, ADR-260007): TypeScript (strict) in a browser-only client-side
  runtime; Node 22, pinned in `.nvmrc`, for build and test at build time only.
- Frameworks and platform: React and Vite with a purely static build output; Vitest with Testing
  Library, Playwright and ESLint (decided, ADR-260007). *Proposed, pending ADR-260002*: hash routing
  once there is more than one view, so deep links need no server rewrite and no `404.html` redirect
  trick; a thin GraphQL client with types generated from `docs/backend/schema.graphql` rather than
  hand-written, keeping the nullability the schema actually declares. Nothing in the stack may
  assume a server.
- Data/storage choices: for the first slice, content files bundled at build time (decided,
  ADR-260008). Proposed after that: **no client-side database.** Crystord Engine is the only store; client
  state is in-tab state, per the online-only MVP (ADR-260003). Browser storage is used only for the
  session token, under the policy ADR-260005 would ratify.
- Infrastructure/deployment model: a GitHub Actions workflow publishing the build to GitHub Pages
  (decided, ADR-260007); the first slice uses a relative base path, so it runs on any hosting target
  (EPIC-260007). *Proposed, pending ADR-260002*: the backend endpoint, the pinned schema range and
  the build identifier generated into the artifact at build time, with the generated file untracked so a developer's local profile cannot become a committed
  default. The hosting target — project site under `<owner>.github.io/liftrack/` versus a custom
  domain — is an **open owner question** that ADR-260002 must resolve, because it also determines
  the base path, the browser origin Liftrack shares with every other project on that account, and
  any Google sign-in origin registration.

## 8. Evolution Tracking

Instantiate the artifact structure defined in `artifact-model.md`. Under
`docs/governance/project/evolution/`: `adr/` + `adr-index.md`, `requirements/` +
`requirement-index.md`, `icr/` + `icr-index.md`, `contracts/` + `contract-index.md`, `epics/` +
`epic-index.md`, and `roadmap.md`. Under `docs/governance/project/learnings/`: the learnings folder
+ `learning-index.md`. Naming, the index-first rule, and the archival lifecycle follow
`artifact-model.md`.

As instantiated on 2026-09-12: `evolution/adr-index.md` lists the ADRs (`ADR-260001`…`ADR-260006`,
all `Proposed`); `evolution/requirement-index.md` the requirements (all `Proposed`);
`evolution/contract-index.md` the contracts (both `Proposed`); `evolution/icr-index.md` the two
ICRs Liftrack has drafted as a **consumer** of the Crystord boundary (`ICR-260001`, `ICR-260003`,
both `Open`, neither submitted); `evolution/epic-index.md` the six epics, all `Ideation`, ordered
by priority; and `learning-index.md` an empty learning log. Counts live in those indexes, not
here — restating them here is exactly the duplication `artifact-model.md`'s indexing rule exists
to prevent.

Project-specific instantiation:

- Decision cadence: one ADR per decision that constrains later work. The six opening ADRs were
  drafted as a set because they interlock — the domain model, the hosting target, the connectivity
  model, the schema pin, the token policy and the adaptation rule each change the others — and they
  are presented to the owner together for acceptance, amendment or rejection.
- Review cadence for project instructions: revisit this file when ADR-260002 is decided (§5 and
  §7's delivery lines depend on it), when
  a parked epic resumes, on every adopted backend schema version, and thereafter per milestone.
  ADR-260001, ADR-260007 and ADR-260008 are already decided.
- Epic ownership: the repository owner writes and maintains epics and their inline task checklists.
  No epic has yet passed the plan-review gate, so no task list is authoritative.

## 9. Loading Matrix Instantiation

Tiers and budget guardrails follow `framework.md` §8 — named per tier below.

Always-on (mandatory) — the two files `CLAUDE.md` `@`-imports, and nothing else:
- `docs/governance/README.md`
- `docs/governance/generic/process/framework.md`

Usually referenced:
- `docs/governance/generic/process/framework-reference.md`
- `docs/governance/generic/process/artifact-model.md`
- `docs/governance/generic/process/epic-process.md`
- `docs/governance/project/project-instructions.md` (this file — kept in tier 2 rather than
  promoted to always-on: it exceeds the always-on per-file budget, and `framework.md` §8's own
  loading defaults place it here)
- `docs/governance/project/evolution/adr-index.md`
- `docs/governance/project/evolution/requirement-index.md`
- `docs/governance/project/evolution/epic-index.md`

On-demand:
- `docs/governance/project/evolution/adr/*`
- `docs/governance/project/evolution/requirements/*`
- `docs/governance/project/evolution/epics/*`
- `docs/governance/project/evolution/icr/*` + `icr-index.md`
- `docs/governance/project/evolution/contracts/*` + `contract-index.md`
- `docs/governance/project/evolution/roadmap.md`
- `docs/governance/project/learnings/*` + `learning-index.md`
- `docs/backend/README.md` (what the vendored copies are, and that they are evidence, not authority)
- `docs/backend/backend-user-guide.md` (the backend's published usage guide, schema `9.3.0`)
- `docs/backend/schema.graphql` (the published SDL, schema `9.3.0`)
- `docs/governance/generic/templates/*` — only when creating or filling out the matching record
