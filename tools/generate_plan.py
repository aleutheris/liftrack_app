#!/usr/bin/env python3
"""Builds content/plan.json from tools/rotation.json: session → muscle group → muscle → exercise.

Usage: python3 -I tools/generate_plan.py [output]   (default: content/plan.json)

Priorities: 100 is normal; 200 means twice as often as 100, 50 half as often, 0 never (parked). Every
layer is picked by the same rule: whoever is furthest behind its fair share of the history so far.
- Muscle groups: each session type lists its allowed groups; the group mix is counted per session type.
- Muscles and exercises: counted over all sessions. An exercise's "trains" split (percent) says what each
  muscle is credited when it is done; without one, its own muscle gets it all.
The history starts at zero and grows with each generated workout.

Guards on top: nothing from the last time a muscle group was trained, nor from the last session of the
same type; no workout that repeats an earlier one, even apart from its core exercise.
The "instead" session (All) replaces Upper 2 in the rare week that allows it, so it is picked from the
history as it stood before Upper 2, remembers the earlier All sessions, and avoids the next week's
Upper 1 and Legs exercises when it can. The weekly history never counts it.
"""
import copy
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "content/plan.json"
rotation = json.loads((ROOT / "tools/rotation.json").read_text(encoding="utf-8"))
catalogue = json.loads((ROOT / "content/exercises.json").read_text(encoding="utf-8"))
GROUPS, SESSIONS = rotation["groups"], rotation["sessions"]
EX = {slug: {**entry, "group": g, "muscle": m}
      for g, gv in GROUPS.items() for m, mv in gv["muscles"].items() for slug, entry in mv["exercises"].items()}
MUSCLE_P = {m: mv["priority"] for gv in GROUPS.values() for m, mv in gv["muscles"].items()}
MUSCLE_ORDER = {m: i for i, m in enumerate(MUSCLE_P)}
for slug, e in EX.items():
    assert slug in catalogue, f"{slug} is not in content/exercises.json"
    trains = e.setdefault("trains", {e["muscle"]: 100})
    assert sum(trains.values()) == 100 and set(trains) <= set(MUSCLE_P), f"{slug}: bad trains {trains}"


def ahead(priorities, counts):
    """Fair-share deficit per item: its share of (history + 1) minus what it has had. Biggest goes first."""
    total_p, total_n = sum(priorities.values()), sum(counts.get(k, 0) for k in priorities)
    return {k: p / total_p * (total_n + 1) - counts.get(k, 0) for k, p in priorities.items()}


def first(scores, order):
    return sorted(scores, key=lambda k: (-round(scores[k], 9), order.index(k)))


def eligible(group, muscle):
    return [s for s, e in EX.items() if e["group"] == group and e["muscle"] == muscle and e["priority"] > 0]


class History:
    def __init__(self):
        self.credit, self.uses, self.together, self.group_uses = Counter(), Counter(), Counter(), Counter()
        self.last_of_group, self.last_of_session = {}, {}

    def groups_for(self, session):
        spec = SESSIONS[session]["groups"]
        counts, picked = Counter({g: self.group_uses[(session, g)] for g in spec}), []
        for _ in range(SESSIONS[session]["slots"]):
            allowed = {g: s["priority"] for g, s in spec.items()
                       if s["priority"] > 0 and picked.count(g) < s.get("max", 99)}
            group = first(ahead(allowed, counts), list(spec))[0]
            picked.append(group)
            counts[group] += 1
        return picked

    def candidates(self, session, group, chosen, avoid_extra=()):
        credit, uses = self.credit.copy(), self.uses.copy()
        for s in chosen:
            uses[s] += 1
            for m, pct in EX[s]["trains"].items():
                credit[m] += pct / 100
        muscles = [m for m in GROUPS[group]["muscles"] if MUSCLE_P[m] > 0 and eligible(group, m)]
        stale, recent = self.last_of_group.get(group, set()), self.last_of_session.get(session, set())
        out = []
        # Frequency first: the muscle whose turn it is comes first; the guards only choose among its exercises.
        for m in first(ahead({m: MUSCLE_P[m] for m in muscles}, credit), muscles):
            pool = eligible(group, m)
            e_def = ahead({s: EX[s]["priority"] for s in pool}, uses)
            pair = {s: max((self.together[frozenset((s, o))] for o in chosen), default=0) for s in pool}
            ranked = [s for s in sorted(pool, key=lambda s: (-round(e_def[s], 9), pair[s], pool.index(s))) if s not in chosen]
            tiers = ([s for s in ranked if s not in stale | recent | set(avoid_extra)],
                     [s for s in ranked if s not in stale | recent], [s for s in ranked if s not in stale], ranked)
            out += next((t for t in tiers if t), [])
        return out

    def commit(self, session, groups, picks):
        for g, s in zip(groups, picks):
            self.uses[s] += 1
            self.group_uses[(session, g)] += 1
            for m, pct in EX[s]["trains"].items():
                self.credit[m] += pct / 100
        by_group = {}
        for g, s in zip(groups, picks):
            by_group.setdefault(g, set()).add(s)
        self.last_of_group.update(by_group)
        self.last_of_session[session] = set(picks)
        for a in range(len(picks)):
            for b in picks[a + 1:]:
                self.together[frozenset((picks[a], b))] += 1


taken_full, taken_without_core = set(), set()


def without_core(slugs):
    return frozenset(s for s in slugs if EX[s]["group"] != "core")


def pick_workout(history, session, avoid_extra=()):
    groups = history.groups_for(session)
    order = sorted(range(len(groups)), key=lambda n: (len(history.candidates(session, groups[n], [])), n))
    budget = [20000]

    def search(chosen):
        if len(chosen) == len(order):
            return chosen if frozenset(chosen) not in taken_full and without_core(chosen) not in taken_without_core else None
        for cand in history.candidates(session, groups[order[len(chosen)]], chosen, avoid_extra):
            budget[0] -= 1
            if budget[0] < 0:
                return None
            found = search(chosen + [cand])
            if found:
                return found
        return None

    chosen = search([])
    if chosen is None:  # every combination is taken: keep the best picks
        chosen = []
        for n in order:
            chosen.append(history.candidates(session, groups[n], chosen, avoid_extra)[0])
    picks = [None] * len(groups)
    for n, s in zip(order, chosen):
        picks[n] = s
    taken_full.add(frozenset(picks))
    taken_without_core.add(without_core(picks))
    return groups, picks


def shown(session, groups, picks):
    """The workout's display order: groups as the session lists them, then muscles as the tree lists them."""
    order = list(SESSIONS[session]["groups"])
    return [s for _, s in sorted(zip(groups, picks), key=lambda gs: (order.index(gs[0]), MUSCLE_ORDER[EX[gs[1]]["muscle"]]))]


WEEKS, INSTEAD = rotation["weeks"], rotation["instead"]
history, plan, before = History(), {}, {}
for week in range(1, WEEKS + 1):
    for day in rotation["week"]:
        if day["id"] == INSTEAD["replaces"]:
            before[week] = copy.deepcopy(history)
        groups, picks = pick_workout(history, day["session"])
        history.commit(day["session"], groups, picks)
        plan[(week, day["id"])] = (f"Week {week} · {day['name']}", shown(day["session"], groups, picks))

# The rare session remembers the earlier ones of its kind, so they rotate among themselves.
seen = History()
for week in range(1, WEEKS + 1):
    h = before[week]
    for counter in ("credit", "uses", "group_uses"):
        getattr(h, counter).update(getattr(seen, counter))
    after = [s for d in rotation["week"][:2] for s in plan[(week % WEEKS + 1, d["id"])][1]]
    groups, picks = pick_workout(h, INSTEAD["session"], avoid_extra=after)
    seen.commit(INSTEAD["session"], groups, picks)
    plan[(week, INSTEAD["id"])] = (f"Week {week} · {INSTEAD['name']}", shown(INSTEAD["session"], groups, picks))


def row(slug):
    e = EX[slug]
    out = {"exercise": slug, "sets": e.get("sets", 4), "reps": e.get("reps", 10)}
    if "per" in e:
        out["per"] = e["per"]
    return out


def render(value):
    return json.dumps(value, ensure_ascii=False)


def render_row(r):
    reps = r["reps"]
    reps_text = f'{{ "min": {reps["min"]}, "max": {reps["max"]} }}' if isinstance(reps, dict) else str(reps)
    per = f', "per": {render(r["per"])}' if "per" in r else ""
    return f'        {{ "exercise": {render(r["exercise"])}, "sets": {r["sets"]}, "reps": {reps_text}{per} }}'


day_order = [d["id"] for d in rotation["week"]] + [INSTEAD["id"]]
workouts = [{"id": f"week-{w}-{d}", "name": name, "exercises": [row(s) for s in slugs]}
            for (w, d), (name, slugs) in sorted(plan.items(), key=lambda kv: (kv[0][0], day_order.index(kv[0][1])))]
blocks = [f'    {{\n      "id": {render(w["id"])},\n      "name": {render(w["name"])},\n      "exercises": [\n'
          + ",\n".join(render_row(r) for r in w["exercises"]) + "\n      ]\n    }" for w in workouts]
OUT.write_text('{\n  "workouts": [\n' + ",\n".join(blocks) + "\n  ]\n}\n", encoding="utf-8")

all_picks = [[r["exercise"] for r in w["exercises"]] for w in workouts]
print(f"wrote {len(workouts)} workouts to {OUT}: {len({frozenset(p) for p in all_picks})} different, "
      f"{len({without_core(p) for p in all_picks})} different without the core exercise")
weekly = [slugs for (w, d), (_, slugs) in plan.items() if d != INSTEAD["id"]]
print(f"Per week, without {INSTEAD['name'].split(' ')[0]} — times picked (muscle credit share vs its target in the group):")
for g, gv in GROUPS.items():
    picked = Counter(EX[s]["muscle"] for slugs in weekly for s in slugs if EX[s]["group"] == g)
    credit = Counter()
    for slugs in weekly:
        for s in slugs:
            for m, pct in EX[s]["trains"].items():
                credit[m] += pct / 100 if m in gv["muscles"] else 0
    total, psum = sum(credit.values()) or 1, sum(MUSCLE_P[m] for m in gv["muscles"])
    print(f"  {g}: " + ", ".join(f"{m} {picked[m] / WEEKS:.2f}/wk ({credit[m] / total:.0%} vs {MUSCLE_P[m] / psum:.0%})"
                                 for m in gv["muscles"]))
