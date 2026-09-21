// Building blocks for the content validators. A location reads like "plan.json days[0].id", so a
// problem message tells the owner which file and which field to fix.

type JsonObject = Readonly<Record<string, unknown>>

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isSlug(value: unknown): value is string {
  return typeof value === 'string' && SLUG.test(value)
}

export function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

export function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

/** `[problem]` when the check failed, `[]` when it passed — for spreading into a problem list. */
export function unless(passed: boolean, problem: string): string[] {
  return passed ? [] : [problem]
}

export function expected(location: string, expectation: string, found: unknown): string {
  const shown = found === undefined ? 'nothing' : JSON.stringify(found)
  return `${location}: expected ${expectation}, found ${shown}`
}

/** One problem per field the format does not define, so a misspelt key is caught, not ignored. */
export function unknownFields(location: string, value: JsonObject, known: readonly string[]): string[] {
  return Object.keys(value)
    .filter((field) => !known.includes(field))
    .map((field) => `${location}: unknown field ${JSON.stringify(field)}`)
}
