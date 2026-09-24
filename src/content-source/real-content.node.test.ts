// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { repeatedKeys } from './repeated-keys'
import { unsafePictureNames } from './validate-catalogue'
import { validateContent } from './validate-content'

// The CI content check (ADR-260008): the repository's own content/, read from disk — the one place
// the picture budgets, the picture file names and the raw JSON text can all be checked.
// Found from this file rather than the working directory, so the check runs the same from any folder.
const contentDir = fileURLToPath(new URL('../../content/', import.meta.url))
const picturesDir = join(contentDir, 'pictures')
const CONTENT_FILES = ['exercises.json', 'plan.json'] as const

function readText(fileName: string): string {
  return readFileSync(join(contentDir, fileName), 'utf8')
}

function pictureSizes(): ReadonlyMap<string, number> {
  const files = readdirSync(picturesDir, { withFileTypes: true }).filter((entry) => entry.isFile())
  return new Map(files.map((file) => [file.name, statSync(join(picturesDir, file.name)).size]))
}

describe('the content in content/', () => {
  // Scans the raw text, before JSON.parse: parsing keeps only the last value of a repeated key.
  it('repeats no key within an object', () => {
    expect(CONTENT_FILES.flatMap((fileName) => repeatedKeys(fileName, readText(fileName)))).toEqual([])
  })

  it('names every picture so that the build can import it', () => {
    expect(unsafePictureNames(pictureSizes().keys())).toEqual([])
  })

  it('has no problem the content check knows of', () => {
    const problems = validateContent({
      exercises: JSON.parse(readText('exercises.json')),
      plan: JSON.parse(readText('plan.json')),
      pictureSizes: pictureSizes(),
    })

    expect(problems).toEqual([])
  })
})
