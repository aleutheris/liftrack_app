# Contract: `liftrack-atom-shape-contract` — Liftrack atom shape

A boundary contract — the standing agreement on the exact shape of the atoms Liftrack writes into
Crystord Engine and reads back. Changes to it require an ICR (`framework.md` §3). Status values:
see `docs/governance/generic/process/artifact-model.md`.

- Contract file: `liftrack-atom-shape-contract.md`
- Status: `Proposed`
- Type: database schema
- Owner: the Liftrack web client — it is the only writer and the only reader of this shape.

> **Status note (2026-09-12, updated same day).** [ADR-260001](../adr/ADR-260001.md) is now
> `Accepted` — the owner accepted it without amendment — which resolves **O3** below: the §8
> arithmetic (3 sessions/week, 6 exercises, 4 sets) stands as the owner did not dispute it when
> asked to accept, amend or reject the ADR it is argued from. This record still cannot reach
> `Active`, though: **O1** and **O2** are unresolved technical unknowns that no acceptance can
> settle — each needs a live probe against a running `9.3.0` deployment, and Liftrack has no code
> yet to run one. Status stays `Proposed` until both are probed and closed. Nothing here has been
> written to a server; no atom of this shape exists. Terminology follows ADR-260001.
>
> **Why a one-party interface still needs a contract.** The provider validates none of this. List
> content is stored as one opaque serialized value and nothing looks inside it
> (`backend-user-guide.md:1198-1203`), labels are free strings within a charset, and bond names
> carry no domain meaning. So every rule below is enforced only by Liftrack's own discipline, and
> a violation is discovered years later, in data that cannot be queried, filtered or migrated by
> the server. The real counterparties here are **Liftrack's writer and Liftrack's reader at
> different releases**.

## Interface Governed

The persisted shape of every atom Liftrack creates: its label set, its `properties.nuclearies`
field usage (including `declaredType` / `typeMode` wherever list content is used), the positional
row contracts inside `content`, the `constants` map, its bonds, and its category assignments —
together with the invariants that must hold across them.

Not governed here: the API through which these atoms travel, which is
[`crystord-graphql-contract.md`](crystord-graphql-contract.md). That record's §5 (known limits
and unreachable behavior) is the reason this shape looks the way it does; this record does not
restate it.

## Provider and Consumers

- Provider: the Liftrack web client (the writer).
- Consumers: the Liftrack web client (the reader) — the same codebase, but **not necessarily the
  same release**. A reader must tolerate every row-schema version any earlier writer produced
  (see "Compatibility and Versioning").
- Not a consumer: Crystord Engine. It stores and returns this shape faithfully and understands
  none of it.

## Contract Definition

### 1. Label vocabulary — closed, opaque, write-once

Every Liftrack label is prefixed `Lift`, matches `[A-Za-z_][A-Za-z0-9_]{0,127}`
(`qt_safe.py:41` — **no hyphens, no colons**), and is assigned at create and never changed.

| Label | Kind | Carried by |
| --- | --- | --- |
| `LiftExercise` | type | a catalogue entry |
| `LiftPlan` | type | a routine / training block |
| `LiftPlanDay` | type | one planned day |
| `LiftSession` | type | one performed gym visit |
| `LiftPerf` | type | one performed exercise (the set log) |
| `LiftD<YYYYMMDD>` e.g. `LiftD20260912` | key | the workout date — on the session atom **and** on each of its `LiftPerf` atoms |
| `LiftM<YYYYMM>` e.g. `LiftM202609` | key | the month bucket — on `LiftSession` **only** (§9) |
| `LiftEx<NNNN>` e.g. `LiftEx0007` | key | which catalogue exercise a `LiftPerf` records |
| `LiftP<NNNN>` e.g. `LiftP0001` | key | which plan a `LiftPlanDay` belongs to |

Two rules that are decisions, not style:

- **Keys are opaque.** `LiftEx0007`, never `LiftExBenchPress`. A label can only be changed by
  rewriting every atom that carries it, one `change` call per atom (updates do not batch —
  `crystord-graphql-contract.md` §2.3), so a label derived from a display name makes a rename a
  multi-thousand-call migration. Display names live in `title`, which is free to edit.
- **The type vocabulary is closed and compiled in.** Liftrack never mints a label at runtime
  beyond the four parameterised key forms above, and never calls `listLabels`.

### 2. Atom kinds

`content` is the atom's one typed main value and the only field behind `declaredType` /
`typeMode` / `effectiveType` / `typeState`. `constants` is an untyped JSON map for machine facts
the UI never renders as prose. `description` is human prose only — never machine state, because
it is untyped, unqueryable and unversioned.

| Kind | `labels` | `nuclearies` | `bonds` | `categories` |
| --- | --- | --- | --- | --- |
| **Exercise** (catalogue) | `["LiftExercise"]` | `title` = display name, user-authored (REQ-FR-260002). `description` = coaching cues. `content` absent. `constants` = `{"schema":"exercise/v1","key":"LiftEx0007","equipment":"barbell","defaultUnit":"kg"}` | none | none |
| **Plan** | `["LiftPlan"]` | `title` = plan name. `description` = prose. `content` = `declaredType:"list"`, `typeMode:"flexible"`, an ordered list of `{"ref": <planDayUuid>}` — the rotation. `constants` = `{"schema":"plan/v1","key":"LiftP0001"}` | none | none |
| **Planned day** | `["LiftPlanDay","LiftP0001"]` | `title` = day name. `description` = notes. `content` = `declaredType:"list"`, `typeMode:"flexible"`, the prescription table (§3.1). `constants` = `{"schema":"planday/v1","columns":[…],"unit":"kg"}` | `[{name:"child", uuid:<planUuid>, direction:"to"}]` | none |
| **Session** | `["LiftSession","LiftD20260912","LiftM202609"]` | `title` = `"2026-09-12 · Push day A"`. `description` = how it went. `content` = the session instant, `declaredType:"datetime"` (open item O1). `constants` = `{"schema":"session/v1","date":"2026-09-12","tz":"Europe/Lisbon"}` | `[{name:"link", uuid:<planDayUuid>, direction:"to"}]` | none |
| **Performed exercise** (the set log) | `["LiftPerf","LiftD20260912","LiftEx0007"]` | `title` = `"<exercise> · 2026-09-12"`. `description` = per-exercise notes. `content` = `declaredType:"list"`, `typeMode:"flexible"`, the set table (§3.2). `constants` = `{"schema":"perf/v1","columns":["setIndex","reps","weight"],"unit":"kg"}` | `[{name:"child", uuid:<sessionUuid>, direction:"to"}, {name:"link", uuid:<exerciseUuid>, direction:"to"}]` | none |

**Out of baseline scope, recorded so it is not assumed:** a `LiftIndex` atom carrying a `COLLECT`
`operation` would give an uncapped count of owned atoms in one round trip. It is **not** part of
this contract's baseline, because ADR-260001's MVP abstains from `operation` entirely; if it is
ever adopted it is an amendment here and a decision in ADR-260001, not a quiet addition.

### 3. Content row contracts — positional, versioned, and unvalidatable by the server

The API accepts "a string, number, JSON array (list atom), or null" as `content`
(`backend-user-guide.md:424`) — **a bare JSON object is not accepted**, so a self-describing
record (`{"reps": 8, "kg": 60}`) is impossible and every row is positional. Column meaning is a
Liftrack convention the server can neither validate, query nor migrate; the version tag in
`constants.schema` is the only thing that makes it survivable.

**3.1 `planday/v1` — one row per prescribed exercise.**
`[ {"ref": <exerciseUuid>}, sets, repsMin, repsMax ]`
Cell 0 is a reference cell; cells 1–3 are integers. `repsMin` equals `repsMax` when the owner
authors a single target rep count rather than a range (REQ-FR-260002). Planned weight is
deliberately absent: the owner's ask is sets and a target rep count or range, planned upfront;
weight is what gets logged per set once performed (REQ-FR-260004), not something REQ-FR-260002
asks the user to prescribe in advance. If a future requirement asks for it, it is a `planday/v2`
column, not a silent addition to this row.

**3.2 `perf/v1` — one row per performed set.**
`[ setIndex, reps, weight ]` — **all three numeric**, with no unit token and no `null`.
`setIndex` is 1-based. The unit is a property of the log, not of a set, and lives in
`constants.unit`.

Why all-numeric: a `"kg"` cell would make every row heterogeneous and permanently foreclose
`typeMode: "strict"`. Numeric-only rows keep `strict` reachable, and RPE or tempo can be appended
as further numeric columns behind a `perf/v2` tag.

**3.3 `plan/v1`** — a flat list of reference cells, in rotation order.

Every list-bearing write sends `declaredType: "list"` and `typeMode: "flexible"` explicitly.
`flexible` is chosen because the guide does not publish what `strict` enforces over nested
heterogeneous lists, and the worst failure this product has is a rejected write with the user
standing at the rack.

### 4. Bonds

The engine's user-assignable bond names are a closed lowercase set — *code-derived:*
`USER_BOND_NAMES = {"link","contains","relates_to","depends","father","child"}`
(`crystord/bond_vocabulary.py:25-31`); anything else is rejected, and the published user guide's
own examples (`DEPENDS_ON`, `BELONGS_TO`, `RELATED_TO`) would all fail. There is no
`PERFORMED_FROM` and a client cannot add one. The honest mapping, recorded so nobody later
"corrects" it:

| Domain relation | Bond | Reading |
| --- | --- | --- |
| performed exercise → its session | `child`, `direction:"to"` | this is a child of that |
| planned day → its plan | `child`, `direction:"to"` | this is a child of that |
| performed exercise → catalogue entry | `link`, `direction:"to"` | generic association — the least-wrong available name |
| session → the planned day it came from | `link`, `direction:"to"` | same |

`direction:"to"` means source → target. The resulting graph is a DAG
(`perf → session → planDay → plan`, and `perf → exercise`), so the engine's cycle check is never
reached.

**Bonds carry meaning, never queryability.** No `retrieve` argument traverses a bond and
`BondOutput` exposes no atom-typed field, so following one costs a round trip per neighbour
(`crystord-graphql-contract.md` §5.9). **Not one read pattern in §9 depends on a bond.** The
redundancy between the `LiftEx0007` label and the `link` bond is deliberate: the label is how the
data is found, the bond is what the relation means.

### 5. Categories

**No baseline use.** The owner asked for a workout tracker, not a muscle-group taxonomy, and a
category value is immutable and undeletable once referenced — the wrong place to carry a
convenience nobody requested. `retrieveCategoryBrowse` (the only 9.3.0 call returning more than
25 atoms per request) was considered as a workaround for a catalogue exceeding 25 exercises and
rejected: it would commit Liftrack to writing a taxonomy into the backend permanently, to solve a
scaling problem the median user does not have. §8/§9 instead accept the truncation
risk explicitly and detect it (REQ-CR-260003) rather than design it away. If a real catalogue
later exceeds 25 entries in practice, revisiting this section is a roadmap candidate, not a
baseline decision — see `roadmap.md`, "Deliberately deferred".

### 6. Invariants

Each is falsifiable by inspecting stored atoms; §Verification says how.

- **I1 — Label cardinality.** Every `LiftPerf` carries exactly three labels: `LiftPerf`, exactly
  one `LiftD<YYYYMMDD>`, exactly one `LiftEx<NNNN>`. Every `LiftSession` carries exactly three:
  `LiftSession`, one `LiftD<YYYYMMDD>`, one `LiftM<YYYYMM>`. Every `LiftPlanDay` carries exactly
  two. No Liftrack atom carries a label outside §1.
- **I2 — A performed set always resolves to its exercise and its session.** For every `LiftPerf`
  atom: its `LiftEx<NNNN>` label identifies exactly one `LiftExercise` atom (whose
  `constants.key` equals that label), and its `LiftD<YYYYMMDD>` label equals the `LiftD` label of
  exactly one `LiftSession` atom. Both resolutions are by label, not by bond, so both are one
  round trip and neither depends on a traversal the API does not have. The `link` and `child`
  bonds must agree with the two labels; a disagreement is corruption, never a fallback.
- **I3 — Set ordering is explicit.** In a `perf/v1` set table, row order is the performance order
  **and** cell 0 (`setIndex`) restates it, 1-based and contiguous. Readers order by `setIndex`
  and treat a disagreement between the two, a gap, or a duplicate as corruption — never
  silently repaired.
- **I4 — Position-as-order, declared.** In `plan/v1` and `planday/v1` there is no ordinal column:
  array position **is** the order, and that is the invariant, not an implication. A reorder is a
  whole-content rewrite of the owning atom, and because updates replace rather than merge, a
  concurrent reorder is last-write-wins.
- **I5 — Row typing.** Every cell of a `perf/v1` row is a number; no string, no `null`, no
  reference. In `planday/v1`, cell 0 is a `{"ref": …}` object — **never a bare UUID string**,
  which the engine rejects outright.
- **I6 — Versioned rows.** Every content-bearing atom carries `constants.schema` naming its row
  contract (`perf/v1`, `planday/v1`, `plan/v1`, `session/v1`, `exercise/v1`) and
  `constants.columns` where a table is stored. A reader that does not recognise the version
  refuses to render that atom and says so; it never guesses at column meaning.
- **I7 — Typed-list declaration.** Every write carrying list content sends
  `declaredType: "list"` and `typeMode: "flexible"` explicitly, on create and on update.
- **I8 — Labels are write-once.** No update ever changes an atom's label set; every update
  resends the stored set verbatim (the API requires `labels` on updates and a short list silently
  rewrites them).
- **I9 — Minimal updates.** An update carries only the nuclearies fields whose values changed,
  and omits `bonds`, `categories` and `constants` unless it is deliberately replacing them in
  full. Resending an existing bond triple is rejected by the engine, and a present-but-partial
  `constants` deletes the keys it omits.
- **I10 — No no-op writes.** Liftrack diffs client-side and sends nothing when nothing changed:
  any request carrying a `properties` key bumps the atom's last-changed stamp, and that stamp is
  the server's result ordering (`qt_fundamentals.py:708`), so a no-op save silently reorders the
  user's history.
- **I11 — The workout date is Liftrack's own data.** It is written in three places that must
  agree: the `LiftD<YYYYMMDD>` label, the `LiftSession` title prefix, and `constants.date`.
  `constants.date` is authoritative; the label is the query key; the title is display. No backend
  timestamp is ever treated as the workout date — a record-time stamp answers when a row was
  written, not when the user trained.
- **I12 — Catalogue keys are stable.** `LiftEx<NNNN>` and `LiftP<NNNN>` are allocated once and
  never reused, never re-derived from a name, never renumbered.
- **I13 — No computed surface.** No Liftrack atom carries `operation`; no `constants` key is in
  UUID shape (the engine resolves a UUID-shaped operand before a constants key, so such a key is
  silently unreachable); Liftrack never submits a system-managed `OP_DEPENDENCY` bond.

**Not an invariant of this baseline: plan-versus-actual comparison.** An earlier draft had every
`LiftPerf` snapshot its prescription into `constants.planned` so "did I hit the plan?" could be
answered from one atom. No requirement asks for that comparison — REQ-FR-260002 and REQ-FR-260004
ask for authoring a plan and logging what was actually done, not for the system to compare them —
so the snapshot is dropped from the baseline. Recorded here, not silently omitted, because it is
exactly the kind of small, irreversible commitment (every future `LiftPerf` would carry it) this
contract exists to make visible before it is written.

### 7. Worked payloads

**(a) Create a planned day.**

```graphql
mutation Create($inputs: [AtomInput]!, $remark: String) { change(inputs: $inputs, remark: $remark) }
```
```json
{
  "remark": "Liftrack: create planned day Push A",
  "inputs": [{
    "labels": ["LiftPlanDay", "LiftP0001"],
    "bonds": [
      { "uuid": "6f1a2b3c-0000-4a11-9c22-aaaabbbbcccc", "name": "child", "direction": "to" }
    ],
    "properties": {
      "nuclearies": {
        "title": "Push day A",
        "description": "Chest/shoulders/triceps. Bench first while fresh; 1-2 reps in reserve on accessories.",
        "declaredType": "list",
        "typeMode": "flexible",
        "content": [
          [ { "ref": "11111111-2222-4333-8444-555555555555" }, 3, 8, 12 ],
          [ { "ref": "22222222-3333-4444-8555-666666666666" }, 3, 8, 12 ],
          [ { "ref": "33333333-4444-4555-8666-777777777777" }, 4, 10, 15 ]
        ],
        "constants": {
          "schema": "planday/v1",
          "columns": ["exerciseRef", "sets", "repsMin", "repsMax"],
          "unit": "kg"
        }
      }
    }
  }]
}
```
Every cell is a valid form: reference objects and numeric literals. No bare UUID string appears
at any level.

**(b) Log set 3 of an exercise — the hot path, an update.**

```graphql
mutation Log($selector: Selector, $inputs: [AtomInput]!, $remark: String) {
  change(selector: $selector, inputs: $inputs, remark: $remark)
}
```
```json
{
  "selector": { "uuid": "9c0d1e2f-3a4b-4c5d-8e6f-7a8b9c0d1e2f" },
  "remark": "Liftrack: set 3 — 6 x 85",
  "inputs": [{
    "labels": ["LiftPerf", "LiftD20260912", "LiftEx0007"],
    "properties": {
      "nuclearies": {
        "declaredType": "list",
        "typeMode": "flexible",
        "content": [ [1, 8, 80], [2, 8, 80], [3, 6, 85] ]
      }
    }
  }]
}
```
Three invariants are visible in this payload: `labels` resent in full (I8); `bonds` and
`categories` omitted (I9 — a resent bond triple is rejected); and `content` sent whole, because
there is no append (§3). A five-set exercise therefore transmits 1+2+3+4+5 = 15 rows across the
workout — a few hundred bytes.

**(c) Start a workout** — one create for the `LiftSession`, then **one batched create** of all
six `LiftPerf` atoms, each carrying its `child` bond to the session uuid returned by the first
call. Creates batch; updates do not. This is the only ordering dependency in the write path, and
it exists because a `LiftPerf` needs its session's uuid before it can bond to it.

### 8. Atom-count budget against the 25-cap

Working assumptions, stated so the owner can correct them: **3 sessions/week, 6 exercises per
session, 4 sets per exercise.** The cap is 25 rows per `retrieve`, unsettable and undetectable
(`crystord-graphql-contract.md` §5.1–5.2), so a shape is only viable if its hot reads sit far
under it.

**What the shape produces.**

| Horizon | `LiftSession` | `LiftPerf` | Total new atoms |
| --- | --- | --- | --- |
| one workout | 1 | 6 | **7** (plus 26 write round trips: 1 session create, 1 batched create of 6, 24 set updates) |
| one month (~13 sessions) | 13 | 78 | **91** |
| one year | 156 | 936 | **~1,092** + catalogue (30–80) + plan (1–5) + planned days (3–6) |
| five years | 780 | 4,680 | **~5,500** |

**What each read costs against the cap.**

| Read | Rows returned | % of cap | Truncates when |
| --- | --- | --- | --- |
| `retrieve(uuid: <atom>)` | 1 | 4% | never |
| `retrieve(labels:["LiftSession","LiftD20260912"])` | 0–1 | 4% | never |
| `retrieve(labels:["LiftPerf","LiftD20260912"])` | 6 (12 worst case) | 24–48% | above 25 exercises in one session — never |
| `retrieve(labels:["LiftPlanDay","LiftP0001"])` | 3–6 | 24% | above 25 planned days in one plan |
| `retrieve(labels:["LiftPerf","LiftEx0007"])` | newest 25 performances | 100% at the cap | ~6 months of weekly work — **benign**: newest-first is exactly the screen's order |
| `retrieve(labels:["LiftSession","LiftM202609"])` | 12–14 | 56% | above 25 sessions in one month |
| `retrieve(labels:["LiftSession"])` | 25 max | at the cap | **session 26 ≈ week 9** — the first silent truncation the product will ever hit |

The two flows performed at the gym — "show me today's workout" and "log this set" — are
**horizon-independent**: a date-qualified read returns ≤ 13 atoms whatever the history size. Every
read that degrades degrades on a browsing screen, where the loss is visible and recoverable. That
placement is the point of the shape, not a coincidence.

### 9. Read patterns this shape supports — and the queries it forbids

Supported, each one round trip: today's session; today's performed exercises; the newest 25
performances of one exercise; one month of sessions; one plan's days; one atom by uuid. All are
label intersections, which the engine evaluates server-side.

**Forbidden queries — each looks correct and is silently wrong:**

- `retrieve(labels:["LiftExercise"])` above 25 entries — accepted as a baseline risk, not worked
  around (§5): the client treats a result of exactly 25 as possibly-truncated (REQ-CR-260003) and
  says so, rather than silently showing an incomplete catalogue.
- `retrieve(labels:["LiftPerf","LiftM202609"])` — ~78 rows, truncated to the newest 25, silently
  dropping two-thirds of the month. **This is exactly why `LiftM<YYYYMM>` is written onto
  `LiftSession` atoms only** (§1) — a month label on `LiftPerf` would manufacture this query.
- `retrieve(labels:["LiftPerf"])` or `retrieve(labels:["LiftSession"])` used as "all history" —
  both return the newest 25, oldest-first losses, no signal.

**Two things this shape cannot do at all**, stated rather than designed around: nothing looks
inside list content, so "every time I squatted above 140 kg" is a client-side scan over whatever
the client managed to fetch, forever; and per-exercise filtering across a session is impossible
server-side in any shape, because an atom takes at most one value per category dimension.

## Compatibility and Versioning

- **Versioning strategy:** every content-bearing atom carries its row contract version in
  `constants.schema` (`perf/v1`, `planday/v1`, `plan/v1`, `session/v1`, `exercise/v1`). Versions
  are per-kind and independent.
- **Backward compatibility is the reader's job, not a migration's.** Adding a column (RPE, tempo)
  mints `perf/v2` for **new** atoms only; the reader supports v1 and v2 side by side. Migrating
  instead would mean one `change` call per historical atom with no transaction across them —
  4,680 sequential calls at five years — and the server can neither help nor verify it. **Never
  migrate what a reader can branch on.**
- **What is cheap to change:** adding a new label to the closed vocabulary; adding a `constants`
  key; adding a trailing numeric column behind a new row version; adding a category value.
- **What is expensive, in order:** (1) the positional row contract — mitigated entirely by
  `constants.schema` if the tag is written from day one; (2) the grain itself — read everything
  page by page, create the new shape, destroy the old, with nothing transactional across it;
  (3) category keys, immutable and undeletable once referenced; (4) labels, where adding is cheap
  and a stale label is harmless.
- **Removable seam.** `LiftM<YYYYMM>` exists only because no temporal filter exists. If the
  provider ever ships one, the label is replaced by a date-range argument, it is written at
  session create only, read by exactly one query path, and referenced by nothing else — removing
  it is a client-side edit and no data migration, since historical atoms keep a harmless extra
  label. **`LiftD<YYYYMMDD>` is not a seam and does not go away** (I11).
- **This record moves with [ADR-260001](../adr/ADR-260001.md).** A change to the shape is an
  amendment to both, reviewed by the owner, never a quiet edit.

### Open items — this contract cannot reach `Active` while they stand

- **O1 — `declaredType: "datetime"` on the session atom.** `datetime` is in the engine's supported
  content types (*code-derived:* `inter_fundamentals.py:150`), but the accepted string forms and
  the normalization are not published. Probe with a full ISO-8601 instant carrying `Z`. Fallback:
  `declaredType: "text"` with the ISO string — nothing in §9 depends on it, since the date is
  already carried by the label and by `constants.date`. **Still open** — needs a live probe.
- **O2 — create-mode UUID return order.** §7(c) assumes the `[String]` returned by a batched
  create is in input order, so six `LiftPerf` atoms can be matched back to their inputs. If it is
  not guaranteed, create them one call each (six round trips, once per workout) or match on
  `title`. **Still open** — needs a live probe.
- ~~**O3** — the §8 assumptions (3 sessions/week, 6 exercises, 4 sets) are the author's, not the
  owner's.~~ **Resolved 2026-09-12.** The owner accepted ADR-260001 without amendment, and this
  arithmetic is exactly what that ADR is argued from; the owner had the opportunity to correct the
  numbers and did not.

## Verification

Shape checks, per `framework.md` §5. **None has been built or run — no Liftrack code calls the backend yet.** Each
is written to be provable end-to-end against a disposable account, and each pairs a negative
assertion with a positive control.

- **S1 — Round trip of a set table.** Log three sets; re-read the atom; assert `content` returns
  as a JSON array of three all-numeric rows with row order and column order preserved, and that
  `declaredType`, `typeMode` and `effectiveType` come back with the pinned values (I5, I7).
  Control: a two-set atom returns two rows.
- **S2 — Resolution (I2).** For a seeded workout, assert every `LiftPerf` resolves to exactly one
  `LiftExercise` by its `LiftEx` label and to exactly one `LiftSession` by its `LiftD` label, and
  that its `link` / `child` bonds name those same two uuids. Control: an atom seeded with a
  mismatched bond is reported as corruption, not silently accepted.
- **S3 — Ordering (I3, I4).** `setIndex` is 1-based, contiguous and agrees with row order; a
  fixture with a duplicated `setIndex` is refused by the reader rather than rendered.
- **S4 — Minimal update (I8, I9).** After a set-logging update, assert the atom's labels, bonds,
  categories and `constants` are byte-identical to before, and only `content` changed. This is
  the check that catches the single most destructive mistake available at this boundary.
- **S5 — No no-op write (I10).** Re-saving an unchanged exercise issues no request; asserted by
  observing zero `change` calls, and paired with a changed-value control that issues exactly one.
- **S6 — Label discipline (I1, I12).** Every atom Liftrack writes matches the §1 vocabulary and
  the engine's label charset; a generated label is rejected client-side before send. Control: the
  four parameterised forms with valid inputs pass.
- **S7 — Budget (§8).** Seed one month of workouts; assert every §9-supported read returns
  strictly fewer than 25 rows, and assert the forbidden reads return exactly 25 — documenting the
  truncation rather than hiding it, and failing the day the cap changes.
- **S8 — Version tolerance.** A reader release handed a fixture containing both `perf/v1` and a
  synthetic `perf/v2` renders both; handed an unknown `perf/v9` it refuses that atom with a
  legible message and still renders the rest.
- **S9 — Catalogue truncation is detected, not hidden (§5).** A catalogue seeded above 25 entries
  returns exactly 25 from `retrieve(labels:["LiftExercise"])` with no signal from the backend, and
  the client-side possibly-truncated check (REQ-CR-260003) fires; a catalogue seeded at or under
  25 entries does not trigger it. Positive and negative control in one check.

## Traceability

- Related requirements: [REQ-FR-260002](../requirements/REQ-FR-260002.md) (upfront plan
  authoring), [REQ-FR-260003](../requirements/REQ-FR-260003.md) (today's workout presentation),
  [REQ-FR-260004](../requirements/REQ-FR-260004.md) (set-level logging of reps and weight),
  [REQ-FR-260005](../requirements/REQ-FR-260005.md) (durable persistence and retrieval),
  [REQ-CR-260003](../requirements/REQ-CR-260003.md) (no silent truncation of a bounded result
  set).
- Related ADRs: [ADR-260001](../adr/ADR-260001.md) — this contract is the shape that ADR would
  ratify and it moves with it; [ADR-260006](../adr/ADR-260006.md) (capability-adaptive use of an
  evolving backend contract), which governs the `LiftM<YYYYMM>` seam.
- Change requests (ICRs): [ICR-260001](../icr/ICR-260001.md) (the 25-cap this budget is argued
  against), [ICR-260003](../icr/ICR-260003.md) (temporal filtering — what would retire
  `LiftM<YYYYMM>`). Both `Open`; neither accepted by the provider. Batch read by uuid was
  considered and not filed — see ADR-260006's Decision — because the denormalised label keys in
  this shape already avoid needing it.
- Related contract: [`crystord-graphql-contract.md`](crystord-graphql-contract.md) — the boundary
  this shape travels through and the source of every limit it is designed against.
- Related epics: [EPIC-260001](../epics/EPIC-260001.md) (agree the workout domain model and
  backend contract), [EPIC-260004](../epics/EPIC-260004.md) (upfront plan authoring),
  [EPIC-260005](../epics/EPIC-260005.md) (today's workout and set logging).
- Evidence: [`docs/backend/backend-user-guide.md`](../../../../backend/backend-user-guide.md) and
  [`docs/backend/schema.graphql`](../../../../backend/schema.graphql), vendored at `9.3.0`;
  engine `file:line` citations refer to the Crystord Engine working copy and are code-derived,
  not observed against a running server.
