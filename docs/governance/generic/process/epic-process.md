# Epic Process (Planning and Execution)

Use this file to plan and execute work through **epics** and their **tasks**. The epic is
the primary planning unit and the level at which the human actually reviews. It replaces
the retired "backlog item" / `BI-` model.

## Why This Exists

- Durable records (ADR / requirement / ICR / contract) and durable knowledge (learnings)
  capture what must hold, why, and what we learned.
- Epics capture what should be built next, why it matters, and how the work breaks down.
- An epic owns a **brief** (the narrative/discussion, kept permanently), an **inline task
  checklist**, and **links** to the durable records it spawns.

## Single Source Of Truth Rule

- **Epic state** lives in the canonical `epic-index.md`; **task states** live inline in the
  epic file's checklist (tasks have no separate file). Do not duplicate either elsewhere.
- Treat the epic brief as the stable definition of intent, not a live status tracker.

## Epic States (exactly three)

1. **Ideation** — the epic is created early as a set of bullet points that must be
   discussed and resolved. The epic stays in Ideation until every bullet is resolved.
   Resolved bullets are the foundation of the tasks.
2. **Ready** — all ideation bullets resolved and the complete task list is defined. Code
   implementation may begin **only** once the epic is Ready — no coding while tasks are
   still being discovered. This is the **plan-review gate**.
3. **Done** — all tasks complete and verified; durable records reconciled with what was
   built; learnings captured. This is the **implementation-review gate**.

## Tasks

- A task is the granularity that makes sense for the model to execute and the human to
  review — the checklist unit. Tasks are created from the epic's ideation bullets once the
  epic is Ready.
- Tasks live **inline inside the epic file** — no per-task files. A task needs only a
  description, a status, and a link to its commit/PR/review. If a task needs more than a
  line or two of spec, that is a signal it is really two tasks.

### Task States (exactly three)

`To Do → In Review → Done`.
- **To Do** — defined, not yet implemented.
- **In Review** — code written, awaiting the human's per-task code review.
- **Done** — reviewed, tests green, no regression.

### Coverage and Quality

- **Per-task code review:** every task gets a code review.
- It is **not** mandatory that each task reach 100% code + test coverage.
- It **is** mandatory that the **epic aims for** full code + test coverage — so each epic
  must include **at least one task dedicated to coverage**.
- Tests must always pass; **regression must not be broken** — gate on every task.

## Prioritization Policy

Prioritize by user outcome, risk reduction, and strategic fit, not implementation
convenience. The ordering lives in `epic-index.md` (priority column).

Use a lightweight score per epic:

- User value: 1-5
- Urgency: 1-5
- Risk reduction / learning value: 1-5
- Effort: 1-5 (lower is better)
- Priority score: `(User value + Urgency + Risk reduction) / Effort`

## Review Cadence

- The two human review gates are the epic transitions into **Ready** (plan review) and into
  **Done** (implementation review).
- Periodically: reprioritize open epics in `epic-index.md`.
- Per release: confirm outcome metrics and close-loop learning.
- Remove stale epics with no clear user value; a `Done` epic's brief is frozen in place as
  reference.
