# Liftrack

A web app for tracking weight-lifting workouts at the gym.

The problem, in the owner's terms: **when you go to the gym you want to know which exercises to
do that day, how many sequences and how many reps — all of it planned upfront — and you want to
save the sequences and reps you actually did, with the weight for each one.** "Sequence" is the
owner's word for what the gym calls a *set*; the terminology is settled once, for the owner to
correct, in `ADR-260001`.

Liftrack stores nothing itself. It is a browser client for an existing backend, the **Crystord
Engine** GraphQL API, which owns the data.

## Current state — the workout days page

The first slice, [`EPIC-260007`](docs/governance/project/evolution/epics/EPIC-260007.md), is a
static page published to GitHub Pages. It shows the planned workout days, one day per page, in
the order they are written in the content files:

- the day's name, then its exercises in order;
- for each exercise: its name, a one-line cue, two pictures of how to do it, and the sets and reps
  — for example "4 sets × 10 reps", "3 sets × 8–12 reps" or "4 sets × 10 reps per leg";
- "Previous day" and "Next day" buttons in a bar at the bottom of the screen, within thumb reach,
  with "Day 2 of 3" between them;
- the day being viewed in the address (`…/#day-2`), so a reload or a phone restoring the tab stays
  on it; an address naming no day shows the first day;
- a footer with the build id — the commit and the time it was built.

The page only reads. There is no sign-in, no backend and no logging of what was done yet; the
content lives in files in this repository until the backend replaces them (`ADR-260008`). The
programme's rationale lives in the owner's private notes, which are deliberately kept out of this
repository; the days themselves are in `content/plan.json`.

**Little else is ratified yet.** The owner has accepted the workout domain model (`ADR-260001`),
the frontend stack (`ADR-260007`: TypeScript, React and Vite) and the first slice's file-based
content (`ADR-260008`). Every other record is a draft for the owner to accept, amend or reject,
and each index holds its records' status. Nothing has been measured against a running backend.

## The backend

Liftrack consumes the Crystord Engine GraphQL API — a single endpoint, bearer-token
authenticated, which stores data as *atoms* carrying labels, typed content, bonds and category
assignments. Liftrack is a consumer of that interface and changes nothing in it.

**The backend is a moving target, and that is a design input rather than an inconvenience.** Its
own project has work in flight that would change what Liftrack can ask for — notably a filed but
undecided request to give atoms a creation timestamp, date-range filtering and client-reachable
result paging. Liftrack is written to keep today's workarounds thin and removable, and to push
its own consumer-backed asks into that project's change process instead of silently absorbing
the gaps. Those asks live in `docs/governance/project/evolution/icr/`; the decision on every one
of them belongs to the Crystord Engine project owner, not to Liftrack.

[`docs/backend/`](docs/backend/) holds a **vendored copy** of the backend's published contract
material — the GraphQL schema and the user guide, taken at schema `9.3.0`. It is read-only
evidence, not authority: the authority is the running backend, confirmed with its `schemaInfo`
query. See [`docs/backend/README.md`](docs/backend/README.md).

## Governance

The single source of governance — for humans and any model alike — is
[`docs/governance/`](docs/governance/). It has two parts: `generic/` is the reusable baseline
policy (process, templates) and is not project-specific; `project/` is Liftrack's own
instantiation — its decisions, requirements, contracts, change requests, epics and learnings.

Two **thin pointers** exist only so tools discover the governance; neither holds policy of its
own:

- [`CLAUDE.md`](CLAUDE.md) — redirects to `docs/governance/`, and imports the always-on core.
- [`.github/copilot-instructions.md`](.github/copilot-instructions.md) — redirects to the same
  place for GitHub Copilot.

## Repository layout

```
README.md                      this file
CLAUDE.md                      thin pointer to docs/governance/
content/                       what the page shows — edit these
  plan.json                    the planned days, in paging order
  exercises.json               the exercise catalogue: names, cues, pictures
  pictures/                    two pictures per exercise
src/
  main.tsx                     entry point: gives the app the file-backed content source
  workout/                     domain types and the WorkoutSource interface (imports nothing)
  content-source/              reads content/, checks it, and answers WorkoutSource
  features/today-workout/      the day pager and the day view, with their styles
  app-shell/                   the app's composition and the build-id footer
  styles/                      tokens.css (every colour) and the base page styles
  architecture.test.ts         fails the tests if an import crosses a module boundary
e2e/                           end-to-end checks on the built site (Playwright)
public/                        copied into the build as-is (favicon)
index.html                     the page shell Vite builds from
package.json, .nvmrc           scripts, dependencies, Node version
vite.config.ts, tsconfig*.json, eslint.config.js, playwright.config.ts
                               build, type-check, lint and end-to-end settings
.github/
  workflows/deploy.yml         checks, builds, tests and publishes to GitHub Pages
  copilot-instructions.md      thin pointer to docs/governance/
docs/
  backend/                     vendored backend evidence (read-only)
    README.md                  provenance and refresh rules
    schema.graphql             Crystord Engine GraphQL schema, 9.3.0
    backend-user-guide.md      Crystord Engine user guide, 9.3.0
  governance/
    README.md                  governance entry point and loading rules
    CHANGELOG.md               shared governance model's release notes
    generic/                   reusable baseline — do not change without explicit consent
    project/                   Liftrack's own governance: project instructions, learnings, and
      evolution/               ADRs, requirements, contracts, ICRs, epics, each with its index,
                               and roadmap.md
```

Each governance index sits **beside** the folder it registers, and is the single source of truth
for that record type's status.

### Sibling repositories

Two sibling repositories are read for reference and never edited from here. `crystord_engine` is
the backend Liftrack consumes — a separate project with its own owner and its own governance.
`projecter` is the upstream source of the generic governance; changing it is a change to shared
policy and needs explicit consent in that repository. Neither is a build- or review-time
dependency of Liftrack: that is why `docs/backend/` vendors the backend evidence Liftrack
actually relies on.

## Getting started

### Run it locally

You need Node 22.13 or later on the 22 line (`.nvmrc` says `22`, so `nvm use` and CI take the
newest 22.x) and npm.

```sh
nvm use        # switch to the Node version in .nvmrc
npm ci         # install exactly what package-lock.json lists
npm run dev    # serve the page at the address Vite prints, usually http://localhost:5173/
```

The dev server reloads the page when you save a file in `content/` or `src/`.

### Checks

CI runs these in this order, and publishes only if all of them pass.

| Command | What it checks |
| --- | --- |
| `npm run lint` | ESLint over the whole repository |
| `npm run typecheck` | TypeScript, strict mode |
| `npm test` | unit and component tests, the content check (100 KB picture budget included), the module boundaries |
| `npm run test:coverage` | the same tests, failing if any line or branch of `src/` goes untested |
| `npm run build` | builds the site into `dist/` |
| `npm run test:e2e` | end-to-end checks on the built site (Playwright) |

`npm run test:e2e` does **not** build: it serves the `dist/` that already exists, so run
`npm run build` first, and again after every change. It serves the site under `/liftrack/`, the
way GitHub Pages serves a project site, on a 360 × 640 touch screen, and checks that:

- every day in `content/plan.json`, opened at its own address, shows the right exercises, cues,
  sets, reps and both pictures loaded, and tapping "Next day" reaches every day in order;
- a reload keeps the day, and an unknown `#…` shows the first day;
- the text sizes, contrast and button sizes meet `REQ-QR-260001`, and with the browser's text
  size at 150% and 200% the paging buttons still show their labels in full;
- the footer names the commit being deployed (a local build says `local`);
- no request fails and no error is logged;
- the JS and CSS stay within 250 KB compressed.

Before the first end-to-end run on a new machine, install the browser: `npx playwright install
chromium`. When a check fails, `npx playwright show-report` opens the report.

### Editing the workout days

The days are in `content/plan.json`, in the order the page shows them. To add a day, add an
entry to `days`; its position in the list is its page:

```json
{ "days": [
    { "id": "day-4", "name": "Day 4 — type B", "exercises": [
        { "exercise": "bulgarian-split-squat", "sets": 4, "reps": 10, "per": "leg" },
        { "exercise": "dumbbell-romanian-deadlift", "sets": 3, "reps": { "min": 8, "max": 12 } } ] } ] }
```

- `id` — a slug (lowercase letters and digits joined by hyphens, like `day-4`), different from
  every other day's. It appears in the address as `#day-4`.
- `name` — the day's heading.
- `exercises` — the exercises in the order they are done. Each has:
  - `exercise` — the exercise's key in `content/exercises.json`;
  - `sets` — a whole number, 1 or more;
  - `reps` — a whole number, or a range `{ "min": 8, "max": 12 }` shown as "8–12 reps";
  - `per` — optional: `"leg"`, `"arm"` or `"side"` when the reps count each side separately,
    shown as "10 reps per leg".

The exercises are in `content/exercises.json`, keyed by a slug that `plan.json` refers to. To add
an exercise, add an entry under a key that is not in the file yet:

```json
"hack-squat": {
  "name": "Hack squat",
  "cue": "Back and hips against the pad",
  "pictures": ["hack-squat-1.webp", "hack-squat-2.webp"]
}
```

- the key — a slug, like `hack-squat`, and a new one: a repeated key would silently replace the
  earlier entry, so the content check rejects any key repeated inside one object.
- `name` — shown above the exercise's pictures.
- `cue` — optional, one line. Leave the field out rather than leaving it empty.
- `pictures` — exactly two file names from `content/pictures/`, in the order they are shown.

**Invalid content fails CI and is never published.** The content check rejects a plan with no
days; a day id that is not a slug or is used twice; a day with no name or no exercises; an
exercise key that `exercises.json` does not have; sets or reps that are not whole numbers of 1 or
more; a range whose `min` is above its `max`; a `per` other than leg, arm or side; a key in
`exercises.json` that is not a slug; an exercise without a name or without exactly two pictures;
an empty cue; a picture file that is missing, too large, of the wrong type or not plainly named;
any field not listed above, so a misspelt key is caught; and any key repeated inside one object,
in either file. Run `npm test` to see the same result before you push.

### Adding pictures

Each exercise has two pictures in `content/pictures/`:

- at most **100 KB each** — a phone photo is several megabytes and must be resized first;
- `.webp`, `.jpg`, `.jpeg`, `.png`, `.avif` or `.svg`;
- named with letters, digits, `.`, `_` and `-` only, starting with a letter or digit, and placed
  directly in `content/pictures/`, not in a folder — for every file there, used or not, as the
  build reads them all;
- about 800 px wide is plenty. WebP or JPEG at medium quality usually lands well under the budget
  (for example `cwebp -q 75 -resize 800 0 photo.jpg -o goblet-squat-1.webp`, or squoosh.app);
- the page shows each picture at 4:3 and crops to fill, so a landscape 4:3 photo loses nothing.

The pictures start as placeholders. To replace one: add the new file to `content/pictures/`, put
its name in place of the placeholder's in the exercise's `pictures` in `content/exercises.json`,
and delete the placeholder file.

### Deploying

1. Create the GitHub repository and push this one to it.
2. In the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` lints, type-checks, runs the
   tests and the content check, builds, runs the end-to-end checks on that build, and only then
   publishes. You can also start it by hand from the **Actions** tab. If any step fails, nothing
   is published and the site keeps the previous build; a failed end-to-end run attaches its report
   to the workflow run.
4. The site is at `https://<owner>.github.io/<repository>/`. The footer's build id (`Build
   <commit> · <time>`) tells you which commit is live — compare it with the latest commit on
   `main`.

**Everything published is public**: the plan, the cues and the pictures can be seen by anyone who
has the address. Nothing private belongs in `content/`.

**The repository is public too.** On GitHub Free, Pages publishes only from a public repository,
so every committed file and its full history can be read by anyone. Deleting a file in a later
commit does not remove it from that history. Private notes belong in a git-ignored file, never in a
commit.

### Changing the project

Changes follow the governance in [`docs/governance/`](docs/governance/README.md): start with its
README, then [`epic-index.md`](docs/governance/project/evolution/epic-index.md) for what is
planned and in which state, and the record indexes beside it — `adr-index.md`,
`requirement-index.md`, `contract-index.md`, `icr-index.md` — before any individual record.
