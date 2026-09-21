# Contract: `crystord-graphql-contract` — Crystord GraphQL boundary

A boundary contract — the standing agreement at the interface between the Liftrack web client and
the Crystord Engine GraphQL API. Changes to it require an ICR (`framework.md` §3). Status values:
see `docs/governance/generic/process/artifact-model.md`.

- Contract file: `crystord-graphql-contract.md`
- Status: `Proposed`
- Type: API
- Owner: Crystord Engine (`crystord_server`) — a separate project. Liftrack does not own this
  boundary and cannot change it; see §6.

> **Status note (2026-09-12).** `Proposed` — drafted, agreed by nobody. Liftrack has no code and
> has never called this API; the backend owner has not seen this record. Every signature below is
> quoted from the vendored evidence in [`docs/backend/`](../../../../backend/) (schema `9.3.0`),
> cited as `schema.graphql:N` and `backend-user-guide.md:N`. Facts that are **not** in that
> evidence are cited to the Crystord Engine working copy and are **code-derived, not observed
> against a running server** — they are marked as such. Per
> [`docs/backend/README.md`](../../../../backend/README.md) the vendored files are evidence, not
> authority: the authority is the running deployment, confirmed by `schemaInfo`. The first
> handshake against that deployment (§V1) is what would move this record toward `Active`.

## Interface Governed

The GraphQL API published by Crystord Engine at a single HTTP `POST` endpoint
(`backend-user-guide.md:159`), at schema version `9.3.0` — specifically the **subset** of that
API Liftrack depends on, enumerated in §2. Operations outside that subset are outside this
contract: Liftrack neither calls them nor relies on them, and their change is not Liftrack's
concern.

`schema { query: Query, mutation: Mutation }` (`schema.graphql:1-4`). **There is no
`Subscription` type** — no server push, no websocket, no invalidation channel. There is no way
for Liftrack to learn a value changed except by asking again; that a refetch must be triggered
by something in Liftrack (entering a view, an explicit refresh — never a polling loop, per
ADR-260003) is Liftrack's own design choice made *within* this constraint, not a property the
boundary itself dictates.

Also governed here: the transport and error conventions of §1, the version handshake of
"Compatibility and Versioning", and the **absences** recorded in §5 — a limit a consumer cannot
reach or detect is as much part of the agreement as a field it can select.

## Provider and Consumers

- Provider: Crystord Engine (`crystord_server`), a separate project with its own governance.
- Consumer governed by this record: the Liftrack web client — a static single-page application
  served from GitHub Pages with no server runtime of its own (ADR-260002), online-only for MVP
  (ADR-260003).
- Other consumers of the same boundary, **not** governed by this record and named only because
  the provider's change process decides breakage by enumerating consumers: `crystord_app`,
  `crystord_gsheets`, `crystord_probe`, and the engine's own harnesses. Liftrack does not appear
  in that enumeration today — ICR-260003 asks to be added before the provider decides its next
  version bump.

## Contract Definition

### 1. Transport, authentication and the error channel

- **Endpoint.** One HTTP `POST` to one URL (`backend-user-guide.md:159`). For a static client the
  host is a **build-time** value (ADR-260002); it must be `https://` or the browser blocks the
  request as mixed content before it leaves the page.
- **Authentication header.** `Authorization: Bearer <session-token>`
  (`backend-user-guide.md:166`).
- **The token is a session bearer token, not a permanent credential**
  (`backend-user-guide.md:169-172`): idle timeout ~24h, absolute cap ~30 days — both written with
  a tilde and therefore approximate, not contractual. It is revoked by `logout`,
  `revokeAllSessions`, a completed password reset, and an email change. There is **no refresh
  call, no expiry timestamp returned with the token, and no session-introspection query**: a
  client cannot compute liveness and must treat any request as the one that discovers the session
  is gone. Liftrack's handling of that is ADR-260005's subject; the boundary fact is recorded
  here.
- **Public operations** (no token): `signin`, `signinGoogle`, `schemaInfo`, `discoverOperations`,
  `collectQueries`, `beginSignup`, `completeSignup`, `requestPasswordReset`,
  `confirmPasswordReset`, `logout` (`backend-user-guide.md:178-180`). Everything else returns
  `AUTHZ-AUTHENTICATION-REQUIRED` without a valid token (`:181-182`).
- **Errors arrive in the standard GraphQL `errors` array, and the code travels in `message`** —
  not in `extensions.code`, and never as a data field (`backend-user-guide.md:184-185`). A
  consumer therefore detects a code by matching a substring of a human-readable string. Liftrack
  depends on that and must treat it as a fragile seam: no code in the published set is a substring
  of another today, but nothing in the guide guarantees it. *Code-derived note:* the provider's
  own `error-surface-contract.md` is `Active` there and moves published codes to
  `extensions.code`, with its own status note recording that enforcement has **not** shipped —
  so the message form is what 9.3.0 emits and the `extensions` form is a change Liftrack should
  expect, tolerate, and not depend on ahead of time (ADR-260006).

### 2. Operations Liftrack depends on (schema `9.3.0`)

Signatures are quoted verbatim. "Breaks Liftrack if" states what change to that operation would
make a Liftrack release stop working — that is the substance of this contract.

#### 2.1 Account access (REQ-FR-260001)

| Signature | Source | Breaks Liftrack if |
| --- | --- | --- |
| `signin(email: String!, password: String!): String!` | `schema.graphql:10` | it stops returning a bare token string, or moves to `Mutation` (see §6) |
| `signinGoogle(idToken: String!): String!` | `schema.graphql:11` | the validated audience changes — the engine verifies one server-configured client ID, so Liftrack's origin must be registered against *that* client, not one of its own |
| `me: User!` → `{ username, email, emailVerified, authMethods }` | `schema.graphql:14`, `:70-75` | it stops being usable as the session-liveness probe |
| `beginSignup(email: String!): Boolean!` | `schema.graphql:102` | it starts revealing whether an email exists (it returns `true` regardless today — `backend-user-guide.md:296-297`) |
| `completeSignup(email: String!, code: String!, password: String!, username: String!): String!` | `schema.graphql:103` | username/password validation rules change without notice — Liftrack pre-validates client-side to avoid a round trip |
| `logout: Boolean!` | `schema.graphql:104` | it stops being idempotent |
| `requestPasswordReset(email: String!): Boolean!` / `confirmPasswordReset(token: String!, newPassword: String!): Boolean!` | `schema.graphql:106-107` | reset stops revoking sessions, or starts preserving the initiating one |
| `revokeAllSessions: Boolean!` | `schema.graphql:105` | it is removed — it is the only compromise-recovery lever a static client can offer |
| `schemaInfo: SchemaInfo!` → `{ schemaVersion, schemaHash, releasedAt }` all `String!` | `schema.graphql:16`, `:62-66` | `schemaVersion` stops being semver, or stops being served publicly — the handshake (ADR-260004) is then impossible |

Google linking (`linkGoogle`), `setPassword`, `unlinkAuthMethod`, email change and
`deleteMyAccount` are **outside** the MVP subset. `deleteMyAccount` is noted only because it
refuses while the caller still owns atoms (`CR-15-OWNED-ATOMS-EXIST`), which makes account
deletion a two-phase flow for any Liftrack user who has ever logged a workout.

#### 2.2 Reads

```graphql
retrieve(labels: [String], uuid: String, categories: [CategoryFilterInput!]): [AtomOutput!]   # schema.graphql:9
listLabels(labelsPrefix: String!): [String!]!                                                 # schema.graphql:15
```

Semantics Liftrack relies on:

- **`retrieve(labels:)` is conjunctive (AND), not disjunctive.** *Code-derived:*
  `crystord/neo4j_query_templates/qt_safe.py:70` joins the label list with `:`, so the match
  clause becomes `MATCH (start:A:B)` — an intersection evaluated server-side. Every read pattern
  in the Liftrack atom shape (`liftrack-atom-shape-contract.md`) is a label intersection, and a
  silent move to OR would turn every one of them into an over-wide, silently truncated result.
  This is the single semantic Liftrack most depends on and the one least documented.
- **Result order is newest-first by last property change.** *Code-derived:*
  `crystord/neo4j_query_templates/qt_fundamentals.py:708` orders by
  `coalesce(start.shellies_last_changed, datetime({epochSeconds: 0})) DESC, start.shellies_uuid
  ASC` before applying `SKIP`/`LIMIT`. This matters because it decides **which** rows a truncated
  read drops: the oldest. Liftrack's "last 25 performances of this lift" screen is correct only
  because of this ordering; the same ordering is what makes a "whole history" read silently start
  in the middle.
- **`AtomOutput` shape Liftrack selects** (`schema.graphql:249-263`): `labels`, `bonds`,
  `properties { shellies { uuid } nuclearies { title description content constants declaredType
  effectiveType typeMode typeState } }`, `categories`. Note the nullability the schema actually
  declares — `labels: [String]`, `bonds: [BondOutput]`, `properties: PropertiesOutput` are all
  nullable, and `retrieve` itself returns a nullable list. Liftrack types them as the schema
  declares them.
- **`NucleariesOutput.content` is `JSON` and must never be coerced to a string.** A list atom
  returns a real JSON array (`schema.graphql:305`); stringifying it destroys the set table
  irreversibly.
- **`NucleariesOutput.title` is `String!` on output but `String` on input**
  (`schema.graphql:304` vs `:240`). Liftrack always sends a title on create, and treats
  `properties.nuclearies` as nullable on read, because non-null propagation on a missing title
  nulls the enclosing object.
- **`properties.shellies.changes` is never selected.** It is a nested paginated field
  (`schema.graphql:277-280`) whose payload is unbounded in practice; not selecting it is a
  Liftrack rule, recorded here because the field is on the read path Liftrack does use.
- **`listLabels` is not used by Liftrack at all** and is listed only so its exclusion is
  deliberate: Liftrack's label vocabulary is a closed compiled-in set, so the 25-cap in §5.5
  cannot bite. If a future release starts calling it, that is a change to this contract.

#### 2.3 Writes

```graphql
change(selector: Selector, inputs: [AtomInput]!, remark: String): [String]!   # schema.graphql:117
destroy(selector: DestroySelector!): DestroyOutcome!                         # schema.graphql:118
```

Semantics Liftrack relies on:

- **One mutation, two modes.** Create = `change` **without** `selector`; update = `change`
  **with** `selector.uuid` (`backend-user-guide.md:338-339`). Returns the affected atom UUIDs
  (`:342`).
- **`labels` is required on every `AtomInput`, updates included** —
  `AtomInput.labels: [String!]!` (`schema.graphql:216`), restated at
  `backend-user-guide.md:340` and `:927`. An update that resends a short label set **rewrites the
  atom's labels**. Liftrack keeps the full label set in memory beside every editable atom and
  resends it verbatim.
- **Present replaces, omitted leaves unchanged — there is no merge**
  (`backend-user-guide.md:931-932`). Per field: `constants` present replaces the whole map and a
  key omitted from the map is deleted (`:934-935`), `{}` clears it (`:936`), omitted leaves it
  untouched (`:937`); `bonds` present replaces all bonds; `categories` present (including `[]`)
  replaces all assignments, omitted leaves them unchanged (`schema.graphql:219-221`). Liftrack's
  hot write path therefore omits `bonds`, `categories` and `constants` and carries only the
  changed nuclearies.
- **Creates batch; updates do not.** *Code-derived:* `inter_form_atoms` loops `args['inputs']`
  (`crystord/atom_interactions/inter_fundamentals.py:858-890`) while the update path indexes
  `args['selector']['uuid']`, singular. N atoms are created in one call; N atoms are updated in N
  calls. Every migration estimate in `liftrack-atom-shape-contract.md` depends on this.
- **A repeated bond triple is rejected.** *Code-derived:*
  `crystord/atom_interactions/inter_fundamentals.py:1214` raises `AU-BOND-DUPLICATE` when
  `(name, uuid, direction)` already exists, so `bonds` is effectively append-only and must be
  omitted from routine updates.
- **`remark` is the only writer-controlled, server-stored, timestamped string in the contract**
  (`schema.graphql:117`; `backend-user-guide.md:341`). Liftrack sends one on every write.
- **`destroy` never errors on a miss.** `DestroyOutcome { requested, deleted, notFound }`
  (`schema.graphql:161-165`); `notFound` means "not found **or not owned by the caller**"
  (`backend-user-guide.md:349`) and a total no-op raises nothing (`:350`). A client that ignores
  the outcome reports success on a complete failure. Liftrack reads `deleted` and compares it to
  `requested`.

#### 2.4 Taxonomy — the exercise catalogue only

The Liftrack atom shape uses exactly one category dimension, on catalogue atoms only, and uses it
for **pagination**, not for classification: browse is the only 9.3.0 call that returns a page of
atoms larger than 25 (§5.1).

```graphql
retrieveCategoryBrowse(valueKey: String, dimensionKey: String, limit: Int, offset: Int,
                       childLimit: Int, childOffset: Int): CategoryBrowseOutput!   # schema.graphql:32
createCategoryDimension(key: String!, displayName: String!, description: String,
                        parentDimensionKeys: [String!], childDimensionKeys: [String!]): CategoryDimensionOutput!   # schema.graphql:132
createCategoryValue(key: String!, displayName: String!, description: String, dimensionKey: String!,
                    parentValueKeys: [String!], childValueKeys: [String!]): CategoryValueOutput!   # schema.graphql:136
```
plus `AtomInput.categories: [CategoryAssignmentInput!]` where
`CategoryAssignmentInput { valueKey: String! }` (`schema.graphql:221`, `:385-387`).

Relied-upon semantics: `retrieveCategoryBrowse` requires **exactly one** of
`valueKey`/`dimensionKey` (`schema.graphql:30`); its pagination defaults to `limit=25` with a
maximum of `100`, over-limit raising `OR-QUERY-LIMIT-EXCEEDED` (`backend-user-guide.md:1112`);
its `atoms` are access-scoped. Taxonomy keys are immutable and a referenced value cannot be
deleted (`CAT-VALUE-REFERENCED`, `backend-user-guide.md:1110-1111`), which is why Liftrack's
category keys are opaque and stable. `retrieveCategoryDimensions` / `retrieveCategoryValues`
(`schema.graphql:27-28`) are used once, at setup, to confirm the dimension exists.

**Not used by Liftrack in MVP, deliberately:** `operation` / `constants` as a computed surface,
`COLLECT` and `collectQueries`, workspaces, sharing and grants, `transferAtomOwnership`,
`discoverOperations`. Abstention removes the whole computed/relational failure surface at no
product cost, and it is recorded here so a later release must justify crossing the line rather
than drift across it.

### 3. Typed list content — the capability the Liftrack shape is built on

`content: JSON` accepts **"a string, number, JSON array (list atom), or null"**
(`backend-user-guide.md:424`). **A bare JSON object is not in the accepted list**, which is why
Liftrack's set records are positional arrays and not `{"reps": 8, "kg": 60}` maps.

- `declaredType` and `typeMode` are inputs (`schema.graphql:245-246`); `typeMode` is `flexible`
  or `strict` (`backend-user-guide.md:426`). Liftrack sends `declaredType: "list"` and
  `typeMode: "flexible"` verbatim on every list write.
- Cell forms are exactly three at every nesting level, recursively, with **no depth cap**:
  literal, `{"ref": "<uuid>"}`, or a nested list (`backend-user-guide.md:1151-1181`).
- **A bare UUID string is not a valid cell** and is rejected before anything is written —
  `AU-TYPE-MISMATCH` on create, `AU-TYPE-CONFLICT` on update (`backend-user-guide.md:1175-1179`).
- Reference cells are returned **unexpanded** by a plain `retrieve`, create **no bonds**, and
  dereference (only inside an operation) solely for atoms the caller owns; an unresolvable
  reference expands to `null` with no error naming the cell (`:1159-1174`).
- There is **no `table` type** — multidimensional means list-of-lists (`:1190-1196`).
- **CT-12: lists are stored, not searched.** "No element is projected into a separate property or
  index, so nothing looks *inside* a list: `retrieve` filters by UUID, labels, and categories
  only" (`:1198-1203`). Everything inside a Liftrack set table is opaque to the server, forever,
  in this release.

**Documentation gap on this exact surface.** The vendored guide never states the allowed values
of `declaredType`, what `typeMode: "strict"` enforces, the value set of `typeState`, or how
`effectiveType` is derived — the four identifiers appear on five lines in total. *Code-derived:*
`SUPPORTED_CONTENT_TYPES = frozenset(['number', 'text', 'boolean', 'datetime', 'list', '', None])`
(`crystord/atom_interactions/inter_fundamentals.py:150`). Liftrack pins the exact strings it
sends and must confirm them against a live deployment (§V4) rather than infer them; ICR-260001
asks the provider to document the surface.

### 4. Error codes Liftrack must handle

Codes arrive inside `errors[].message` (§1). The realistic MVP set, with what Liftrack does:

| Code | Cause at this boundary | Liftrack's handling |
| --- | --- | --- |
| `AUTHZ-AUTHENTICATION-REQUIRED` | no/expired/revoked token | discard token, preserve the in-memory form, route to sign-in |
| `AUTH-RATE-LIMITED` | per-email or per-IP throttle | back off, "try again later"; never infer account existence |
| `AUTH-GOOGLE-NOT-LINKED` | Google sign-in to an unlinked account | actionable message: sign in with a password once, then link |
| `AUTH-GOOGLE-EMAIL-MISMATCH` | linking a different Google identity | actionable message |
| `SIGNUP-INVALID-OR-EXPIRED-CODE`, `SIGNUP-ACCOUNT-ALREADY-EXISTS` | signup flow | field-level message |
| `USER-INVALID-USERNAME`, `PASSWORD-TOO-SHORT`, `PASSWORD-TOO-LONG`, `PASSWORD-TOO-COMMON` | credential form rules | pre-validate client-side; map to the offending field |
| `RESET-INVALID-OR-EXPIRED-TOKEN` | password reset | restart the reset |
| `AU-UNAUTHORIZED` | write or bond touching an atom the caller cannot reach | treat as a defect, not a user error; report with the atom uuid |
| `AU-TYPE-MISMATCH` / `AU-TYPE-CONFLICT` | an invalid list cell on create / on update | block the write and report the offending row; never retry blindly |
| `AU-BOND-DUPLICATE` | a bond triple resent on update (*code-derived*, `inter_fundamentals.py:1214`) | a Liftrack bug: `bonds` must be omitted from updates |
| `AC-LABELS-INVALID` / `AC-LABELS-RESERVED` | a malformed or `_`-prefixed label on a write (*code-derived*, `inter_fundamentals.py:676`, `:680`) | a Liftrack bug: the label vocabulary is closed and charset-checked before send |
| `OR-QUERY-LIMIT-EXCEEDED` | a category page request above 100 | clamp client-side; treat as a bug if it fires |
| `CAT-DUPLICATE-DIMENSION`, `CAT-REDUNDANT-ANCESTOR`, `CAT-VALUE-REFERENCED` | catalogue taxonomy writes | block and report |
| `CR-15-OWNED-ATOMS-EXIST` | account deletion while atoms exist | drive the two-phase delete flow |
| anything else | — | surface the raw message unmodified; never guess |

`AU-BOND-DUPLICATE`, `AC-LABELS-INVALID` and `AC-LABELS-RESERVED` do **not** appear in the
published guide's error inventory. That omission is itself a contract defect and is folded into
ICR-260001's documentation ask.

### 5. Known limits and unreachable behavior

This section is the load-bearing part of the record. Each item is a **code-derived** property of
`9.3.0` that no Liftrack code can fix, read from the Crystord Engine working copy vendored under
`docs/backend/` and cited by `file:line` — not observed against a running deployment, since
Liftrack has none. Each one shapes ADR-260001's data shape.

**5.1 `retrieve` silently caps at 25 atoms and a client cannot change it.** *Code-derived, and
the single most consequential fact at this boundary.*
`_DEFAULT_RETRIEVE_LIMIT = 25`, `_MAX_RETRIEVE_LIMIT = 100`
(`crystord/atom_interactions/inter_fundamentals.py:1406-1407`); the limit is read at `:1419` and
an over-limit raises `OR-QUERY-LIMIT-EXCEEDED` at `:1421`.
`CrystordService.retrieve_atoms(..., limit=None, ...)` accepts a limit
(`crystord_server/services.py:675`), but the resolver
`retrieve(_, info, labels=None, uuid=None, categories=None)`
(`crystord_server/resolvers.py:86-91`) never forwards one — so the default 25 always applies. The
published SDL has no `limit`, no `offset`, no sort and no temporal argument
(`schema.graphql:9`). `offset` exists internally and is commented "Internal offset support (no
GraphQL `retrieve` arg)" (`inter_fundamentals.py:1423-1424`), reachable only through the category
drill-down.

**5.2 The cap is undetectable, and that is a contract defect.** `retrieve` returns a bare
`[AtomOutput!]`: no count, no cursor, no flag, no error. 25 rows at the cap are indistinguishable
from "exactly 25 matched" and from "800 matched". **And the published user guide never documents
the cap for `retrieve` at all** — its `retrieve` entry (`backend-user-guide.md:232-235`) carries
no cap sentence, while the sibling surface `listLabels` is documented in full at `:253-256`, and
the only "limit=25, max 100" line in the guide (`:1112`) sits inside the Categories section and
reads as a taxonomy rule. A consumer following the published contract therefore experiences
**silent data loss** with no way to detect it. This is the reason ICR-260001 exists, and its
documentation half is the cheapest fix available to the provider.

**5.3 No batch fetch by UUID set at the GraphQL boundary.** `input Selector` publishes
`uuids: [String]` (`schema.graphql:207`) and `DestroySelector` publishes it too (`:212`), but
`retrieve` exposes only `uuid: String`, singular (`:9`). *Code-derived:* the predicate already
ships — `WHERE n.shellies_uuid IN $selector.uuids`
(`crystord/neo4j_query_templates/qt_fundamentals.py:459`) — on the **destroy** path. Reading N
known atoms is N round trips. Recorded as a known limit, not asked for: `liftrack-atom-shape-
contract.md` §4 denormalises what each screen needs, so no read Liftrack issues resolves a bond
reference and this limit costs Liftrack nothing in practice.

**5.4 No temporal filter and no atom timestamps.** `AtomOutput` carries no `createdAt`/`updatedAt`
(`schema.graphql:249-263`) while `WorkspaceOutput` (`:176-184`), `CategoryDimensionOutput`
(`:318-330`) and `CategoryValueOutput` (`:332-344`) all do — atoms are the sole outlier. "Give me
the session performed on 2026-09-12" is therefore not expressible server-side, and the workout
date must be data Liftrack writes rather than a timestamp it reads. The only time-bearing surface
is `ShelliesOutput.changes` (`schema.graphql:277-288`), which is per-atom, reachable only through
a `retrieve` that already returned that atom, unfilterable by time and unsortable across atoms.
ICR-260003.

**5.5 `listLabels` caps at 25 with unspecified membership and no truncation flag**
(`backend-user-guide.md:253-256`), matches prefixes case-sensitively, never returns `_`-prefixed
labels (`:251-252`), and is scoped to atoms the caller **owns** (`:249-250`). Liftrack does not
call it (§2.2) — which is the mitigation, not a claim that the cap is harmless.

**5.6 Reserved labels.** Labels beginning with `_` are system-reserved; a write carrying one is
rejected (*code-derived:* `AC-LABELS-RESERVED`, `inter_fundamentals.py:680`, `:874`) and the
charset is `[A-Za-z_][A-Za-z0-9_]{0,127}` (`crystord/neo4j_query_templates/qt_safe.py:41`) — **no
hyphens and no colons**. Every Liftrack label must satisfy that pattern.

**5.7 Update replaces what it carries.** Restated here as a *limit*, not just a semantic: there
is no partial update, no field merge and no array append, so logging one set resends the whole
set table, and any update that under-sends `labels`, `bonds`, `categories` or `constants`
destroys the omitted members of whatever it does send (§2.3).

**5.8 Two further silent-omission surfaces**, structurally identical to 5.2 and named so no
Liftrack screen presents a server result as complete: category **hide-on-read** omits assignments
to taxonomy the caller cannot read, with no indication (`backend-user-guide.md:1118-1120`); and
`destroy` reports an authorization refusal as `notFound`, indistinguishable from "already gone"
(`:349`).

**5.9 No traversal, no full-text, no tombstones.** No query argument walks a bond —
`BondOutput` carries `{uuid, name, direction, required}` and no atom-typed field
(`schema.graphql:265-270`), so following a bond costs one `retrieve(uuid:)` per neighbour. There
is no full-text or fuzzy search at this boundary. Deletion is a hard delete with no tombstone, so
"what was removed while I was away" is unanswerable by construction — a standing reason for
Liftrack to stay online-only (ADR-260003).

### 6. Liftrack is a consumer with no authority over this boundary

Liftrack does not own, version, or change this interface. Every need Liftrack has of it that this
contract cannot meet is drafted as an ICR against Crystord Engine, ready to raise with that
project's owner (`framework.md` §3) — not yet submitted: ICR-260001 (reachable bounds and
detectable truncation, plus the missing `retrieve` cap paragraph), ICR-260003 (atom timestamps
and temporal filtering, as a consumer endorsement of the provider's own pending work). REQ-CR-260001
binds Liftrack to consume the contract unmodified; REQ-CR-260003 binds Liftrack never to present a
bounded result set as complete. Until an ICR is approved upstream, Liftrack designs around the
limit and keeps the workaround thin and removable (ADR-260006) — it does not assume the fix.

## Compatibility and Versioning

- **Versioning strategy:** the provider publishes semver through `schemaInfo.schemaVersion`
  (`schema.graphql:16`, `:62-66`). This record is written against **`9.3.0`**, released
  2026-08-25 per the vendored guide's own header. `schemaHash` is diagnostic only.
- **Handshake:** Liftrack performs the `schemaInfo` check before any other call, on every cold
  start, and judges the reported version against its configured range. The policy — the range
  form, what blocks, what warns, and how an unreachable backend is distinguished from an
  incompatible one — is ADR-260004's; this record only fixes that the handshake exists and that
  `schemaVersion` is the authority.
- **Pinned range:** `^9.3.0`. A purely additive MINOR must not take Liftrack offline. This is a
  deliberate departure from the sibling consumers, which pin `~9.3.0` and would hard-block on
  `9.4.0`; a static page on GitHub Pages cannot heal itself, so a wrongly narrow pin is a total
  outage that only a human commit can end (ADR-260002, ADR-260004).
- **Backward-compatibility guarantees Liftrack relies on:** within a major, additions only — no
  field removed, no argument made required, no nullability tightened on a field Liftrack selects,
  no change to the AND semantics of `retrieve(labels:)`, and no change to the newest-first result
  ordering. Liftrack tolerates additions it does not select, unknown enum members on fields it
  does not branch on, and new error codes (which fall through to the generic handler, §4).

### Known planned changes — PENDING upstream, not committed

Recorded so Liftrack designs for them without depending on them. **None of this is approved, and
none of it may be assumed shipped.** Nothing in Liftrack's MVP requires any of it.

- **Engine ICR-260024** (`Open` in the record itself — "drafted, not approved"; carried as
  `pending` in the engine's `icr-index.md`; filed 2026-09-08 as EPIC-260108's T2 gate) proposes
  `9.3.0 → 9.4.0`, additive/MINOR: `created`/`updated` range inputs on `retrieve`;
  `enum AtomChangeKind { ANY, PROPERTIES }`; a whitelisted `sort` argument; **client-reachable
  `limit`/`offset`**; nullable `createdAt`/`updatedAt` on `AtomOutput`; and a persisted atom
  creation timestamp with a best-effort backfill.
- **What it would and would not change for Liftrack.** It would make 5.1's bounds reachable and
  5.4's date filtering native. It explicitly does **not** amend the page limits — the record
  states the 25/100 bounds are applied, not raised — and a deferred raise beyond 100 sits behind
  a separate engine epic that is still in ideation. It adds no truncation signal (5.2 survives —
  a full page would remain an inference, not a fact), no batch read by UUID (5.3 survives), and
  no way to look inside list content (CT-12 survives).
- **Record-time is not event-time.** A creation timestamp answers "when the row was written", not
  "when the user trained". Liftrack's workout date stays its own data regardless
  (`liftrack-atom-shape-contract.md`, invariant I11), and ICR-260003 says so explicitly so the
  provider does not over-scope on Liftrack's behalf.
- **On adoption:** a version move is an amendment to this record, not a code change made quietly.
  Refresh `docs/backend/` from the provider, re-run the verification below, and record the
  adoption here.

## Verification

Boundary checks, per `framework.md` §5 (end-to-end and contract checks are the primary
verification). **None of these has been built or run — Liftrack has no code.** Each is written to
be provable against a live deployment with a disposable test account.

- **V1 — Version handshake.** `schemaInfo` returns a parseable semver; it satisfies the
  configured range; the reported `schemaVersion` equals the version `docs/backend/` was vendored
  from. Negative control: a configured range that excludes the reported version blocks startup
  with a message naming both the version and the range. Distinguishing control: an unreachable
  endpoint produces a *different*, non-version diagnostic.
- **V2 — Truncation detection (the check that proves 5.1/5.2).** With a disposable account, create
  26 atoms carrying one Liftrack label; `retrieve` on that label; assert **exactly 25** rows
  return, assert the 26th uuid is absent, and assert the response carries no count, cursor, flag
  or error. This is a **red-state** check: it does not pass, it *documents* the silent loss and
  fails the day the provider fixes it — which is the signal to revisit ICR-260001. Paired
  positive control: a label with 3 atoms returns 3 rows.
- **V3 — Client-side truncation guard (REQ-CR-260003).** Any `retrieve` returning exactly 25 rows
  is surfaced to the user as possibly incomplete. The check asserts the guard fires on the V2
  fixture and does not fire on its 3-atom control.
- **V4 — Typed list round trip (the §3 gap).** Write a nested numeric list with
  `declaredType: "list"`, `typeMode: "flexible"`; read it back and assert `content` is returned as
  a JSON array with row and column order preserved, and that `declaredType`, `effectiveType`,
  `typeMode` and `typeState` come back with the exact values this contract pins. Negative
  control: a bare UUID string in a cell is rejected with `AU-TYPE-MISMATCH` on create and
  `AU-TYPE-CONFLICT` on update.
- **V5 — Label AND semantics.** Atoms labelled `{A}`, `{B}` and `{A,B}`; assert
  `retrieve(labels: ["A","B"])` returns only the `{A,B}` atom. A regression here invalidates every
  Liftrack read pattern.
- **V6 — Replace semantics.** An update carrying only `properties.nuclearies.content` leaves
  `labels`, `bonds`, `categories` and `constants` unchanged; an update carrying a short `labels`
  list rewrites them (asserted as the destructive behavior it is, so the guard against it is
  itself tested).
- **V7 — Error channel.** A gated call without a token yields `AUTHZ-AUTHENTICATION-REQUIRED` in
  `errors[].message`; the client's detector matches it from the message form, and also from
  `extensions.code` and HTTP 401, so a provider move to `extensions.code` does not break
  re-authentication.
- **V8 — Destroy outcome.** A `destroy` of one owned and one unknown uuid returns the owned one in
  `deleted` and the unknown one in `notFound`, and raises no error; the client reports partial
  failure rather than success.
- **V9 — Category browse pagination.** `retrieveCategoryBrowse(dimensionKey:, limit: 100)` returns
  more than 25 atoms for a catalogue seeded above 25, and `limit: 101` raises
  `OR-QUERY-LIMIT-EXCEEDED`.

## Traceability

- Related requirements: [REQ-CR-260001](../requirements/REQ-CR-260001.md) (consume the Crystord
  contract unmodified), [REQ-CR-260002](../requirements/REQ-CR-260002.md) (browser-only secret
  handling over an HTTPS backend origin), [REQ-CR-260003](../requirements/REQ-CR-260003.md) (no
  silent truncation of a bounded result set),
  [REQ-FR-260001](../requirements/REQ-FR-260001.md) (account access and session lifecycle),
  [REQ-FR-260005](../requirements/REQ-FR-260005.md) (durable persistence and retrieval).
- Related ADRs: [ADR-260001](../adr/ADR-260001.md) (the domain mapping this boundary must carry),
  [ADR-260004](../adr/ADR-260004.md) (schema-compatibility handshake and version pinning),
  [ADR-260005](../adr/ADR-260005.md) (session token storage and re-authentication),
  [ADR-260006](../adr/ADR-260006.md) (capability-adaptive use of an evolving backend contract).
- Change requests (ICRs): [ICR-260001](../icr/ICR-260001.md),
  [ICR-260003](../icr/ICR-260003.md) — both `Open`, both drafted by Liftrack as a consumer, neither
  submitted to or accepted by the provider.
- Related contract: [`liftrack-atom-shape-contract.md`](liftrack-atom-shape-contract.md) — the
  data shape Liftrack writes **through** this boundary; it is constrained by §5 and validated by
  none of it.
- Related epics: [EPIC-260001](../epics/EPIC-260001.md) (agree the domain model and backend
  contract), [EPIC-260006](../epics/EPIC-260006.md) (raise Liftrack's read-pattern needs into the
  Crystord contract).
- Evidence: [`docs/backend/schema.graphql`](../../../../backend/schema.graphql) and
  [`docs/backend/backend-user-guide.md`](../../../../backend/backend-user-guide.md), both vendored
  at `9.3.0`; engine `file:line` citations refer to the Crystord Engine working copy and are
  code-derived, not observed.
