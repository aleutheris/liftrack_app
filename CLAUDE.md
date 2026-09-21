# CLAUDE.md — Liftrack

Governance for this project — for humans and any model — lives in
[`docs/governance/`](docs/governance/).

This project is worked on most often with Claude, so the **always-on governance core is
imported below** (Claude auto-loads `@`-imports; plain links are not). Everything else loads
on demand — do not preload it.

@docs/governance/README.md
@docs/governance/generic/process/framework.md

## Loading the rest (on demand)

The router (imported above) owns the scope-routing rules and loading triggers — follow them,
and load only what the task needs. The deeper tiers (`framework-reference.md`,
`artifact-model.md`, `epic-process.md`, `project/project-instructions.md`, templates, and
individual records) are **not** preloaded.

This file is a thin pointer plus the Claude import of the always-on core; the single source of
governance is `docs/governance/`.

## Working environment

- The working directory is already the project root
  (`/media/ample/Data/Projects/Liftrack/liftrack_app`). Do not prefix Bash commands with `cd` when
  the command operates on the project root.
- Sibling repositories, read for reference only and never edited from here:
  `/media/ample/Data/Projects/crystord/crystord_engine` (the backend this app consumes — a separate
  project), `/media/ample/Data/Projects/crystord/crystord_app` (the sibling frontend whose stack
  ADR-260007 reuses), and `/media/ample/Data/Projects/projecter` (the upstream source of the generic
  governance — changing it is a `generic instructions` change and requires explicit consent in that
  repository).
