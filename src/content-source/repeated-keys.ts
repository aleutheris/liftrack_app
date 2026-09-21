// A key repeated within one JSON object never reaches the validators: JSON.parse, like the build's
// JSON import, keeps only its last value. A copy-pasted exercise left under its old slug, or a row
// with "sets" twice, would silently replace content, so the CI content check scans the raw text.

type Segment = string | number

/** An object or list that is open at the current point of the text. */
interface Open {
  readonly path: readonly Segment[]
  readonly isList: boolean
  /** How often each key has appeared so far; stays empty for a list. */
  readonly keyCounts: Map<string, number>
  /** The current member's key, or its index in a list: where a nested object or list sits. */
  member: Segment
  expectingKey: boolean
}

interface Repeat {
  readonly path: readonly Segment[]
  readonly key: string
  readonly keyCounts: ReadonlyMap<string, number>
}

// A string with its escapes, or a character that opens, closes or separates members. Numbers,
// true, false, null and whitespace never decide where a key is, so they are skipped.
const TOKEN = /"(?:[^"\\]|\\.)*"|[{}[\],]/g

/**
 * One problem per key that appears more than once within the same object, in the order of each
 * first repeat, e.g. 'plan.json days[0].exercises[1]: key "sets" appears twice'. The same key in
 * different objects is fine. Expects JSON: the caller's JSON.parse reports text that is not.
 */
export function repeatedKeys(fileName: string, text: string): string[] {
  const open: Open[] = []
  const repeats: Repeat[] = []
  for (const [token] of text.matchAll(TOKEN)) {
    const current = open.at(-1)
    if (token === '{' || token === '[') open.push(opening(current, token === '['))
    else if (token === '}' || token === ']') open.pop()
    else if (current !== undefined) read(current, token, repeats)
  }
  return repeats.map((repeat) => problem(fileName, repeat))
}

function opening(parent: Open | undefined, isList: boolean): Open {
  return {
    path: parent === undefined ? [] : [...parent.path, parent.member],
    isList,
    keyCounts: new Map(),
    member: 0,
    expectingKey: !isList,
  }
}

function read(current: Open, token: string, repeats: Repeat[]): void {
  if (token === ',') {
    if (current.isList) current.member = Number(current.member) + 1
    else current.expectingKey = true
  } else if (current.expectingKey) {
    const key = JSON.parse(token) as string
    const count = (current.keyCounts.get(key) ?? 0) + 1
    current.keyCounts.set(key, count)
    current.member = key
    current.expectingKey = false
    if (count === 2) repeats.push({ path: current.path, key, keyCounts: current.keyCounts })
  }
}

function problem(fileName: string, { path, key, keyCounts }: Repeat): string {
  const count = keyCounts.get(key)
  const times = count === 2 ? 'twice' : `${count} times`
  if (path.length === 0) {
    return `${fileName}: key ${JSON.stringify(key)} appears ${times} at the top level`
  }
  const location = path
    .map((segment, index) => {
      if (typeof segment === 'number') return `[${segment}]`
      return index === 0 ? ` ${segment}` : `.${segment}`
    })
    .join('')
  return `${fileName}${location}: key ${JSON.stringify(key)} appears ${times}`
}
