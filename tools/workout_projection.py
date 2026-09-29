#!/usr/bin/env python3
"""Project upcoming workouts from the training program.

A development experiment, outside the app: it reads tools/program.toml (the slots and exercise
pools behind program-context.md) and prints the workouts as Markdown tables. The page never runs
it; the owner copies what they want into content/ by hand.

Two files, two different things — the same split content/plan.json and content/exercises.json
already make:

- content/exercises.json is the exercise CATALOGUE: what an exercise is — its name, its coaching
  cue, and up to two picture file names in content/pictures/. This script only reads it.
- tools/program.toml is the DOING: which catalogue exercise goes in each slot, in what rotation,
  and its sets/reps ("dose"). A pool entry is a catalogue slug, e.g. "leg-press" — never a name
  or a cue typed out again. An exercise the catalogue does not have yet is shown as such, not
  invented; add it to content/exercises.json (a name is enough — cue and pictures are optional).

The pick rule is deliberately plain and deterministic — no randomness, no dates:

- Workout n has type cycle[(n - 1) % len(cycle)]: with ["A", "B"], odd workouts are A and even
  workouts are B.
- Each slot picks from its pool in the order written, one step further each time that pool is
  used, and wraps around at the end.
- A slot with a pool per type (A = [...], B = [...]) steps each pool only on workouts of that
  type. A slot with no pool for a type is left out of it.

Usage: python3 tools/workout_projection.py [LAST] [--first N] [--program FILE] [--catalogue FILE]
"""

from __future__ import annotations

import argparse
import json
import sys
import tomllib
from dataclasses import dataclass
from pathlib import Path

DEFAULT_PROGRAM = Path(__file__).with_name("program.toml")
DEFAULT_CATALOGUE = Path(__file__).parent.parent / "content" / "exercises.json"
EVERY_WORKOUT = "pool"
SLOT_KEYS = {"name", "label", EVERY_WORKOUT, "dose"}
ENTRY_KEYS = {"exercise", "dose"}


class ProgramError(Exception):
    """The program file or the catalogue breaks a rule; the message says where."""


@dataclass(frozen=True)
class Entry:
    slug: str
    dose: str


@dataclass(frozen=True)
class Slot:
    label: str
    pools: dict[str, tuple[Entry, ...]]  # "pool" for every workout, else a workout type


@dataclass(frozen=True)
class CatalogueExercise:
    name: str
    cue: str
    pictures: tuple[str, ...]  # 0-2 file names in content/pictures/, per content/exercises.json


@dataclass(frozen=True)
class Resolved:
    """An entry with its catalogue facts looked up — or their absence, if it has none yet."""

    slug: str
    name: str
    dose: str
    cue: str
    pictures: tuple[str, ...]
    catalogued: bool


@dataclass(frozen=True)
class Row:
    label: str
    exercise: Resolved
    is_new: bool


@dataclass(frozen=True)
class Workout:
    number: int
    kind: str
    rows: tuple[Row, ...]


def reject_unknown(table: dict, allowed: set[str], where: str) -> None:
    unknown = sorted(set(table) - allowed)
    if unknown:
        raise ProgramError(f"{where}: unknown key(s) {', '.join(unknown)}")


def text(table: dict, key: str, where: str, default: str = "") -> str:
    value = table.get(key, default)
    if not isinstance(value, str):
        raise ProgramError(f"{where}: '{key}' must be text")
    return value.strip()


def parse_entry(raw: object, slot: dict, where: str) -> Entry:
    fields = {"exercise": raw} if isinstance(raw, str) else raw
    if not isinstance(fields, dict):
        raise ProgramError(f"{where}: an entry is a catalogue slug, or {{ exercise = \"...\", dose = \"...\" }}")
    reject_unknown(fields, ENTRY_KEYS, where)
    slug = text(fields, "exercise", where)
    if not slug:
        raise ProgramError(f"{where}: an entry has no 'exercise' slug")
    dose = text(fields, "dose", f"{where}, {slug}", text(slot, "dose", where))
    if not dose:
        raise ProgramError(f"{where}, {slug}: no dose — give the entry or its slot a dose")
    return Entry(slug, dose)


def parse_pool(raw: object, slot: dict, where: str) -> tuple[Entry, ...]:
    if not isinstance(raw, list) or not raw:
        raise ProgramError(f"{where}: a pool is a non-empty list")
    entries = tuple(parse_entry(item, slot, where) for item in raw)
    slugs = [entry.slug for entry in entries]
    repeated = sorted({slug for slug in slugs if slugs.count(slug) > 1})
    if repeated:
        raise ProgramError(f"{where}: listed twice: {', '.join(repeated)}")
    return entries


def parse_slot(raw: object, number: int, cycle: list[str]) -> Slot:
    where = f"slot {number}"
    if not isinstance(raw, dict):
        raise ProgramError(f"{where}: must be a [[slot]] table")
    where = f"slot {number} ({text(raw, 'name', where) or 'unnamed'})"
    reject_unknown(raw, SLOT_KEYS | set(cycle), where)
    keys = [key for key in (EVERY_WORKOUT, *cycle) if key in raw]
    if not keys:
        raise ProgramError(f"{where}: needs a pool, or a pool per workout type ({', '.join(cycle)})")
    if EVERY_WORKOUT in keys and len(keys) > 1:
        raise ProgramError(f"{where}: use either 'pool' or pools per type, not both")
    pools = {key: parse_pool(raw[key], raw, f"{where}, {key}") for key in keys}
    return Slot(text(raw, "label", where, str(number)), pools)


def parse_program(data: dict) -> tuple[list[str], list[Slot]]:
    reject_unknown(data, {"cycle", "slot"}, "top level")
    cycle = data.get("cycle", ["A", "B"])
    valid = isinstance(cycle, list) and cycle and all(isinstance(kind, str) and kind for kind in cycle)
    if not valid or len(set(cycle)) != len(cycle) or SLOT_KEYS & set(cycle):
        raise ProgramError('cycle: distinct workout types that are not slot keys, e.g. ["A", "B"]')
    slots = data.get("slot")
    if not isinstance(slots, list) or not slots:
        raise ProgramError("the program needs at least one [[slot]]")
    return cycle, [parse_slot(raw, number, cycle) for number, raw in enumerate(slots, start=1)]


def load_catalogue(path: Path) -> dict[str, CatalogueExercise]:
    """Read content/exercises.json for display only — not a substitute for the site's own CI check."""
    with path.open("r", encoding="utf-8") as file:
        try:
            raw = json.load(file)
        except json.JSONDecodeError as error:
            raise ProgramError(f"{path}: invalid JSON — {error}") from error
    if not isinstance(raw, dict):
        raise ProgramError(f"{path}: must be an object of slug -> exercise")
    catalogue = {}
    for slug, fields in raw.items():
        name = fields.get("name") if isinstance(fields, dict) else None
        if not isinstance(name, str) or not name.strip():
            raise ProgramError(f"{path}: '{slug}' has no name")
        cue = fields.get("cue", "")
        pictures = fields.get("pictures") or []
        catalogue[slug] = CatalogueExercise(name.strip(), cue if isinstance(cue, str) else "", tuple(pictures))
    return catalogue


def resolve(entry: Entry, catalogue: dict[str, CatalogueExercise]) -> Resolved:
    found = catalogue.get(entry.slug)
    if found is None:
        return Resolved(entry.slug, entry.slug, entry.dose, "", (), False)
    return Resolved(entry.slug, found.name, entry.dose, found.cue, found.pictures, True)


def project(cycle: list[str], slots: list[Slot], last: int, catalogue: dict[str, CatalogueExercise]) -> list[Workout]:
    steps: dict[tuple[int, str], int] = {}
    seen: set[str] = set()  # exercise slugs
    workouts = []
    for number in range(1, last + 1):
        kind = cycle[(number - 1) % len(cycle)]
        rows = []
        for index, slot in enumerate(slots):
            key = EVERY_WORKOUT if EVERY_WORKOUT in slot.pools else kind
            pool = slot.pools.get(key)
            if pool is None:
                continue
            step = steps.get((index, key), 0)
            steps[(index, key)] = step + 1
            resolved = resolve(pool[step % len(pool)], catalogue)
            rows.append(Row(slot.label, resolved, resolved.slug not in seen))
        seen.update(row.exercise.slug for row in rows)
        workouts.append(Workout(number, kind, tuple(rows)))
    return workouts


def cell(value: str) -> str:
    return value.replace("|", "\\|")


def photo_cell(exercise: Resolved) -> str:
    if not exercise.catalogued:
        return "—"
    return "no photo yet" if not exercise.pictures else f"{len(exercise.pictures)} of 2"


def render(workout: Workout) -> str:
    lines = [
        f"### Workout {workout.number} — type {workout.kind}",
        "",
        "| Slot | Exercise | Sets × reps | Cue | Photos |",
        "|---|---|---|---|---|",
    ]
    mark_new = workout.number > 1
    for row in workout.rows:
        name = cell(row.exercise.name)
        if mark_new and row.is_new:
            name += " **(new)**"
        if not row.exercise.catalogued:
            name += " *(not catalogued)*"
        lines.append(
            f"| {cell(row.label)} | {name} | {cell(row.exercise.dose)} | {cell(row.exercise.cue)} "
            f"| {photo_cell(row.exercise)} |"
        )
    new = sum(row.is_new for row in workout.rows)
    if mark_new and new:
        lines += ["", f"New movements in this workout: {new}"]
    return "\n".join(lines)


def missing_from_catalogue(workouts: list[Workout]) -> list[str]:
    return sorted({row.exercise.slug for workout in workouts for row in workout.rows if not row.exercise.catalogued})


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Print the projected workouts of tools/program.toml.")
    parser.add_argument("last", nargs="?", type=int, default=12, help="last workout to show (default 12)")
    parser.add_argument("--first", type=int, default=1, help="first workout to show (default 1)")
    parser.add_argument("--program", type=Path, default=DEFAULT_PROGRAM, help="program file (TOML)")
    parser.add_argument("--catalogue", type=Path, default=DEFAULT_CATALOGUE, help="exercise catalogue (JSON)")
    args = parser.parse_args(argv)
    if not 1 <= args.first <= args.last:
        parser.error("need 1 <= --first <= LAST")
    return args


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    try:
        with args.program.open("rb") as file:
            cycle, slots = parse_program(tomllib.load(file))
    except FileNotFoundError:
        print(f"{args.program}: not found — create it, or pass --program FILE", file=sys.stderr)
        return 2
    except (tomllib.TOMLDecodeError, ProgramError) as error:
        print(f"{args.program}: {error}", file=sys.stderr)
        return 2

    try:
        catalogue = load_catalogue(args.catalogue)
    except FileNotFoundError:
        print(f"{args.catalogue}: not found — pass --catalogue FILE, or run from the repository root", file=sys.stderr)
        return 2
    except ProgramError as error:
        print(error, file=sys.stderr)
        return 2

    workouts = project(cycle, slots, args.last, catalogue)[args.first - 1 :]
    shown = f"{args.first}–{args.last}" if args.first < args.last else str(args.last)
    print(f"# Projected workouts {shown}\n")
    print("\n\n".join(render(workout) for workout in workouts))

    missing = missing_from_catalogue(workouts)
    if missing:
        print(f"\n---\n\nNot yet in {args.catalogue} ({len(missing)}) — add each with at least a name:\n")
        print("\n".join(f"- {slug}" for slug in missing))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
