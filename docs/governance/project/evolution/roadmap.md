# Roadmap — Architecture Direction

Living architecture-direction narrative for Liftrack — not an index and not a per-item record. The
canonical registries are [`adr-index.md`](adr-index.md), [`requirement-index.md`](requirement-index.md),
[`icr-index.md`](icr-index.md), [`contract-index.md`](contract-index.md) and
[`epic-index.md`](epic-index.md). When a direction here hardens into a decision, record the ADR and
link it. Kept short by design.

## Current shape

Greenfield. **There is no application code, no scaffold and no package manifest** — the repository
holds governance, the vendored backend contract in `../../../backend/`, and nothing else.

What exists is a first instantiation of governance v2.0.0 (2026-09-12), and **little of it is
ratified**: the owner has accepted the workout domain model (ADR-260001, 2026-09-12) and the
frontend stack and the first slice's file-based content (ADR-260007, ADR-260008, 2026-09-21), and has agreed no requirement and confirmed no contract.
The indexes hold each record's status; this sentence does not. Anything below that does not name an
accepted ADR is a proposal awaiting a decision, not a baseline.

Five things are owner input rather than proposal, and the rest of this file is costed against them:
the product is a web client for a single lifter whose programme is planned upfront; sets, reps and
weights are logged per set; persistence is the Crystord Engine GraphQL API, which Liftrack consumes
and does not own; hosting must work on GitHub Pages; and — since 2026-09-21 — the work starts with a
static page that shows the planned workout days from files in the repository, one per page, with
sign-in and the backend following.

## Near-term direction

The owner re-sequenced the work on 2026-09-21: start with the smallest useful thing, and park the
six original epics ([`epic-index.md`](epic-index.md), **Parked**).

1. **Workout days from files** (EPIC-260007 → [ADR-260007](adr/ADR-260007.md),
   [ADR-260008](adr/ADR-260008.md)). The stack, the first build, test suite and Pages deploy, and one
   page: each planned day's exercises — two pictures, a cue, sets and reps — paged one day at a time,
   read from JSON in the repository through a source interface the backend adapter implements later. The content mirrors
   ADR-260001, so moving to the backend is a data move, not a redesign.
2. **Then the parked sequence, when the owner resumes it**, in the order and for the reasons
   `epic-index.md` records: the domain model's remaining work and the consumer requests
   (EPIC-260001, EPIC-260006 — backend ICR-260024 is still pending, so Liftrack's input is worth
   more before that decision than after), backend-facing delivery (EPIC-260002), then account
   access, plan authoring and set logging (EPIC-260003 → EPIC-260005). The first slice leaves two
   items for that work: the per-side reps qualifier needs a `planday/v2` column in the atom-shape
   contract, and
   the hosting target must be chosen before sign-in.

## Major pending decisions

- **Atom shape** — the grain is decided ([ADR-260001](adr/ADR-260001.md), accepted 2026-09-12); the
  positional column contract the server can neither validate nor migrate,
  [`liftrack-atom-shape-contract.md`](contracts/liftrack-atom-shape-contract.md), is not yet
  confirmed, and since the first slice it also lacks a column for reps counted per side, which
  `planday/v1` does not express (a `planday/v2` amendment).
- **Static delivery and hosting target** — [ADR-260002](adr/ADR-260002.md). Project site versus
  custom domain is an owner answer, and it also settles the base path, the routing style, and which
  other sites share Liftrack's browser origin. The first slice sidesteps it with a relative base
  path and no routing; the answer is due before sign-in.
- **Online-only MVP** — [ADR-260003](adr/ADR-260003.md). Settled as an owner input; the ADR records
  the consequence, which is that a set is not logged until its mutation returns and there is no
  queue behind it.
- **Schema pin and boot handshake** — [ADR-260004](adr/ADR-260004.md). Proposes `^9.3.0` over
  `~9.3.0`: the sibling clients' tilde pins hard-block on a purely additive `9.4.0`, and a static
  Pages bundle cannot heal itself — it stays broken until a human pushes a commit.
- **Token storage and re-authentication** — [ADR-260005](adr/ADR-260005.md). Coupled to ADR-260002:
  on a shared `*.github.io` origin every other project under that account can read the same storage.
  The real driver is how much re-authentication is tolerable mid-workout.
- **Capability-adaptive use of an evolving contract** — [ADR-260006](adr/ADR-260006.md). The rule
  that keeps each workaround thin and removable, and the reason the backend adapter is a module
  boundary rather than a utility file.

## Moving backend

The contract Liftrack consumes is a moving target, and all of the following is **upstream, owned by
the Crystord Engine project, and unapproved**. Liftrack must ship correctly against `9.3.0` as it
stands and treat every date below as unknown.

- **Backend ICR-260024** (`pending`, filed 2026-09-08) proposes schema `9.3.0` → `9.4.0`, additive
  and MINOR: `created`/`updated` range inputs on `retrieve`, an `AtomChangeKind` enum, a whitelisted
  `sort` argument, **client-reachable `limit`/`offset`**, nullable `createdAt`/`updatedAt` on
  `AtomOutput`, and a persisted creation timestamp with a best-effort backfill. It is the gate on
  backend EPIC-260108 (`Ready`). For Liftrack it would unlock paging past row 25 (to 100), a page
  key that an edit does not reorder, and a coarse "written in this window" filter — but its own §2
  says the page limits are **applied, not amended**, so the ceiling stays at 100.
- **Backend EPIC-260101** (`Ideation`) records the defect underneath today's behavior: `retrieve`
  pagination is implemented and tested but unreachable, so no client can see atom 26. It is why the
  cap is silent rather than merely low.
- **Backend EPIC-260109** — `LABELS`, `CATEGORIES` and `SYSTEM` change kinds, one MINOR bump each —
  is named by EPIC-260108's task list but **not yet filed**. Liftrack should record itself as a
  non-consumer: it never relabels or recategorises a session, so the kinds would select the same
  set for it permanently.
- **The 100 → 500 page-limit raise** is deferred behind backend EPIC-260099 closing and has no epic
  of its own yet. **Design for 100, not 500.**
- Nothing here removes the need for Liftrack to hold the workout date as its own data: a creation
  timestamp is record-time, not event-time, and a session typed the next morning is not a session
  performed the next morning.

## Deliberately deferred

Candidates for later consideration, **not commitments**. The owner has agreed to none of them; none
has a requirement, an epic, or a date, and naming one here is not a plan to build it.

- **Offline support and a write queue.** The largest of these, and explicitly out of MVP by
  ADR-260003. Note the dependency before anyone reopens it: the backend leaves no tombstone when an
  atom is deleted, so "what changed while I was away" is unanswerable by construction.
- **History and progression views** beyond the current session — blocked less by effort than by the
  page cap and by the absence of any temporal filter today.
- **Personal records and volume analytics.** The backend cannot look inside list content, so any
  such view is a client-side scan over whatever the client managed to fetch. There is no honest
  workaround, and that should be said to the owner rather than designed around.
- **Multi-user, coach sharing and workspaces.** Reference cells dereference only atoms the caller
  owns, so a plan shared by a coach would resolve to nulls with no error naming the failing cell.
- **Rest timers and other in-session tooling.**
- **Cross-device read-back.** ADR-260003's working assumption is one lifter, one device, one tab;
  REQ-FR-260005 was drafted then corrected to match it. Revisit only if the owner names a second
  device as a real scenario — it is a requirement change, not an implementation detail.
- **A muscle-group (or any) exercise taxonomy.** Considered as a pagination workaround for a
  catalogue exceeding 25 entries and rejected in `liftrack-atom-shape-contract.md` §5: a category
  value is immutable and undeletable once referenced, too permanent a commitment for a problem the
  median user may never have. REQ-CR-260003's truncation detection is the baseline answer instead.
- **Plan-versus-actual comparison** ("did I hit the plan?"). Considered as a `constants.planned`
  snapshot on every performed exercise and dropped — no requirement asks for the comparison, only
  for authoring a plan (REQ-FR-260002) and logging what happened (REQ-FR-260004). Revisit only
  behind its own requirement, since the field is nearly free to add now and expensive to add once
  years of `LiftPerf` atoms exist without it.
- **Planned target weight.** REQ-FR-260002 asks for planned sets and reps, not a planned weight;
  `planday/v1` (§3.1 of the shape contract) carries no `targetWeight` column. If wanted later it is
  a `planday/v2` column, not a silent addition to `v1`.
- **Specific interaction mechanics** — steppers vs. sliders for adjusting a logged value, confirm
  dialogs before deleting a set or discarding a session, a dedicated diagnostics screen, and
  surfacing `revokeAllSessions` in the UI. REQ-QR-260001, REQ-OR-260002 and ADR-260005 state the
  outcomes these would serve without prescribing the UI; EPIC-260003 and EPIC-260005 decide the
  actual surface when they reach Ready.
