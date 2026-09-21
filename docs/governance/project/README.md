# Project Governance (instantiated)

This folder holds **project-specific** governance — the records and instructions for *this*
project, as opposed to the reusable baseline in `docs/governance/generic/`. `projecter` ships
it as a **reserved skeleton** (this README only); a real project creates the structure below
on instantiation, following `docs/governance/generic/process/project-instructions.md`.

## Structure to create

- `project-instructions.md` — the project's instantiated instructions (from the generic
  template of the same name).
- `evolution/` — durable records and planning, one file per item, each index sitting **beside**
  the folder it registers:
  - `adr/` + `adr-index.md`
  - `requirements/` + `requirement-index.md`
  - `icr/` + `icr-index.md`
  - `contracts/` + `contract-index.md`
  - `epics/` + `epic-index.md`
  - `roadmap.md` (architecture-direction narrative; not an index)
- `learnings/` + `learning-index.md` — durable knowledge (kept outside `evolution/`).

Naming, status values, indexing, and the archival lifecycle are defined in
`docs/governance/generic/process/artifact-model.md`. Keep policy out of this folder — it holds
records and project-specific instructions only.
