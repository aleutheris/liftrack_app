// Test support: a small valid content set in the files' own format, and edited copies of it, so each
// negative control differs from valid content by exactly the defect it names.
import type { ContentFiles } from '../validate-content'

const VALID = {
  exercises: {
    'leg-press': {
      name: 'Leg press',
      cue: 'Feet mid-platform, knees track over toes',
      pictures: ['leg-press-1.webp', 'leg-press-2.jpg'],
    },
    'pallof-press': { name: 'Pallof press', pictures: ['pallof-press-1.png', 'pallof-press-2.svg'] },
  },
  plan: {
    days: [
      {
        id: 'day-1',
        name: 'Day 1 — type A',
        exercises: [
          { exercise: 'leg-press', sets: 4, reps: 10 },
          { exercise: 'pallof-press', sets: 3, reps: { min: 8, max: 12 }, per: 'side' },
        ],
      },
      {
        id: 'day-2',
        name: 'Day 2 — type B',
        exercises: [{ exercise: 'leg-press', sets: 1, reps: { min: 5, max: 5 } }],
      },
    ],
  },
  // Picture file name → bytes; exactly at the budget, tiny, and unknown (null) are all valid.
  pictureSizes: {
    'leg-press-1.webp': 40_960,
    'leg-press-2.jpg': null,
    'pallof-press-1.png': 1,
    'pallof-press-2.svg': 800,
  },
}

export type Path = readonly (string | number)[]
/** Sets the value at `path` (e.g. `['plan', 'days', 0, 'id']`), or removes it when undefined. */
export type Edit = readonly [path: Path, value: unknown]

type Node = Record<string | number, unknown>

export function contentWith(...edits: readonly Edit[]): ContentFiles {
  const content = structuredClone(VALID) as Node
  edits.forEach(([path, value]) => setAt(content, path, value))
  return {
    exercises: content.exercises,
    plan: content.plan,
    pictureSizes: new Map(Object.entries(content.pictureSizes as Record<string, number | null>)),
  }
}

function setAt(root: Node, path: Path, value: unknown): void {
  const parent = path.slice(0, -1).reduce<Node>((node, key) => node[key] as Node, root)
  const key = path[path.length - 1] as string | number
  if (value === undefined) delete parent[key]
  else parent[key] = value
}
