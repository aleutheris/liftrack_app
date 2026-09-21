# Project Governance

This folder is the **single source of governance** for this project — for humans and any AI
tool alike. The conventional entry points (`CLAUDE.md`, `.github/copilot-instructions.md`)
are thin pointers that redirect here.

- **Canonical authority and loading policy:**
  [`generic/process/framework.md`](generic/process/framework.md).
- **Version history and migration notes:** [`CHANGELOG.md`](CHANGELOG.md).

## Request Scope Routing (Mandatory)

Interpret every prompt across these change scopes:

- `generic instructions` — reusable baseline policy in this file and `docs/governance/generic/`.
- `project instructions` — `docs/governance/project/`.
- `code` — implementation, tests, and runtime/configuration files.

Rules:

- By default a prompt may authorize `project instructions`, `code`, or both.
- Never change `generic instructions` without an explicit request; if a request might need
  it and consent is missing, ask first.
- State the interpreted scope before applying changes.

## What to Load

Load only what the task needs (see `framework.md` §8 for the tiers and budgets):

- Design, architecture, tradeoff, or verification tasks → `generic/process/framework-reference.md`.
- Creating, filing, indexing, or archiving any record → `generic/process/artifact-model.md`.
  Then load the relevant `<record-type>-index.md` **before** opening individual records — never
  bulk-load a record folder.
- Epic planning, prioritization, or task breakdown → `generic/process/epic-process.md`.
- Project bootstrap or governance instantiation → `generic/process/project-instructions.md`;
  when present, `docs/governance/project/project-instructions.md`.
- Architecture-direction ("where is this heading") questions →
  `docs/governance/project/evolution/roadmap.md`.
