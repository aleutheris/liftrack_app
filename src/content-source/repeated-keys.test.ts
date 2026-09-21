import { repeatedKeys } from './repeated-keys'

// Texts in the shape of the two content files. JSON.parse would accept every text below without a
// word, keeping only the last value of each repeated key.
const EXERCISES = `{
  "leg-press": {
    "name": "Leg press",
    "cue": "Feet mid-platform, knees track over toes",
    "pictures": ["leg-press-1.svg", "leg-press-2.svg"]
  },
  "pallof-press": { "name": "Pallof press", "pictures": ["pallof-press-1.svg", "pallof-press-2.svg"] }
}`

const PLAN = `{
  "days": [
    {
      "id": "day-1",
      "name": "Day 1",
      "exercises": [
        { "exercise": "leg-press", "sets": 4, "reps": 10 },
        { "exercise": "pallof-press", "sets": 3, "reps": { "min": 8, "max": 12 }, "per": "side" }
      ]
    },
    { "id": "day-2", "name": "Day 2", "exercises": [{ "exercise": "leg-press", "sets": 1, "reps": 5 }] }
  ]
}`

const EXTRA_LEG_PRESS = `"leg-press": { "name": "Hack squat", "pictures": ["a.svg", "b.svg"] },`

describe('repeatedKeys', () => {
  it.each([
    ['exercises.json, whose exercises share their field names', EXERCISES],
    ['plan.json, whose days and rows share their field names', PLAN],
    ['a key that appears again only inside a string value', String.raw`{ "a": "5\" wide, \"a\": 1", "b": 2 }`],
    ['values that match keys of their own object', '{ "a": "b", "b": "a" }'],
    ['objects nested in objects with the same key', '{ "a": { "a": { "a": 1 } }, "b": { "a": 2 } }'],
    ['empty objects and lists', '{ "a": {}, "b": [], "c": [{}, [], { "a": 1 }] }'],
    ['a file that is a bare value, with no keys at all', '"leg-press"'],
  ])('passes %s', (_case, text) => {
    expect(repeatedKeys('x.json', text)).toEqual([])
  })

  it.each([
    [
      'an exercise slug used twice', 'exercises.json', EXERCISES.replace('{', `{ ${EXTRA_LEG_PRESS}`),
      'exercises.json: key "leg-press" appears twice at the top level',
    ],
    [
      'a field repeated within an exercise', 'exercises.json',
      EXERCISES.replace('"cue"', '"name": "Hack squat", "cue"'),
      'exercises.json leg-press: key "name" appears twice',
    ],
    [
      'a field repeated within a row', 'plan.json', PLAN.replace('"per"', '"sets": 4, "per"'),
      'plan.json days[0].exercises[1]: key "sets" appears twice',
    ],
    [
      'a field repeated within a range', 'plan.json', PLAN.replace('"max"', '"min": 10, "max"'),
      'plan.json days[0].exercises[1].reps: key "min" appears twice',
    ],
    [
      'a field repeated within a later day', 'plan.json',
      PLAN.replace('"reps": 5', '"reps": 5, "exercise": "x"'),
      'plan.json days[1].exercises[0]: key "exercise" appears twice',
    ],
    [
      'a list of rows given twice to one day', 'plan.json',
      PLAN.replace('"id": "day-1",', '"exercises": [{ "sets": 1 }], "id": "day-1",'),
      'plan.json days[0]: key "exercises" appears twice',
    ],
  ])('reports %s, naming the file, the object and the key', (_case, fileName, text, problem) => {
    expect(repeatedKeys(fileName, text)).toEqual([problem])
  })

  it.each([
    ['holds escaped quotes', String.raw`{ "say \"hi\"": 1, "say \"hi\"": 2 }`, String.raw`"say \"hi\""`],
    ['follows a value ending in a backslash', String.raw`{ "a": "C:\\", "b": 1, "b": 2 }`, '"b"'],
    ['follows a value holding brackets', '{ "a": "} ] {", "b": 1, "b": 2 }', '"b"'],
    ['is written once with an escape', String.raw`{ "a": 1, "\u0061": 2 }`, '"a"'],
    ['sits in text with no spaces', '{"a":1,"a":2}', '"a"'],
  ])('finds a repeated key that %s', (_case, text, key) => {
    expect(repeatedKeys('x.json', text)).toEqual([`x.json: key ${key} appears twice at the top level`])
  })

  it('reports each repeated key once, with its count, in the order of each first repeat', () => {
    const text = '{ "b": { "x": 1, "x": 2 }, "a": 1, "a": 2, "a": 3, "b": 4 }'

    expect(repeatedKeys('x.json', text)).toEqual([
      'x.json b: key "x" appears twice',
      'x.json: key "a" appears 3 times at the top level',
      'x.json: key "b" appears twice at the top level',
    ])
  })
})
