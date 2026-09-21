# Backend Reference (vendored)

Liftrack consumes the **Crystord Engine** GraphQL API. This folder is a *vendored copy* of the
backend's own published contract material, taken so that Liftrack stays self-contained: the
`crystord_engine/` symlink at the repository root is temporary and must not be a build- or
review-time dependency.

| File | Source | Taken from schema |
| --- | --- | --- |
| `backend-user-guide.md` | `crystord_engine/docs/user-guide.md` | `9.3.0` |
| `schema.graphql` | `crystord_engine/crystord_server/schema.graphql` | `9.3.0` |

**These files are read-only here.** They are evidence, not authority: the authority is the running
backend, confirmed with the `schemaInfo` query. Never edit them to reflect a wanted behavior —
refresh them from the backend repository when Liftrack adopts a newer schema version, and record
the adoption per `docs/governance/project/evolution/contracts/crystord-graphql-contract.md`.
