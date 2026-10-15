import { expected, isObject, isText, unknownFields, unless } from './json-checks'
import type { PictureFiles } from './validate-catalogue'

const FIELDS = ['author', 'license', 'licenseUrl', 'source'] as const
const LINKS = ['licenseUrl', 'source'] as const

/**
 * Checks content/picture-credits.json (ADR-260008 amendment, 2026-10-14). Absent entirely is fine: only
 * pictures taken from elsewhere need a credit. Each credit is shown as links, so both must be https.
 */
export function validateCredits(credits: unknown, pictures: PictureFiles): string[] {
  if (credits === undefined) {
    return []
  }
  if (!isObject(credits)) {
    return [expected('picture-credits.json', 'an object keyed by picture file name', credits)]
  }
  return Object.entries(credits).flatMap(([fileName, entry]) => validateCredit(fileName, entry, pictures))
}

function validateCredit(fileName: string, entry: unknown, pictures: PictureFiles): string[] {
  const location = `picture-credits.json ${fileName}`
  // Like a picture an exercise names: CI fails a credit for a file that is not there, so a typo cannot
  // leave a real picture uncredited; the page just has nothing to attach it to.
  const fileProblems = unless(
    !pictures.mustExist || pictures.sizes.has(fileName),
    `${location}: ${JSON.stringify(fileName)} is not in content/pictures/`,
  )
  if (!isObject(entry)) {
    return [...fileProblems, expected(location, `an object with ${FIELDS.map((f) => `"${f}"`).join(', ')}`, entry)]
  }
  return [
    ...fileProblems,
    ...unknownFields(location, entry, FIELDS),
    ...FIELDS.flatMap((field) =>
      unless(isText(entry[field]), expected(`${location}.${field}`, 'a non-empty string', entry[field])),
    ),
    ...LINKS.flatMap((field) =>
      unless(
        !isText(entry[field]) || isHttpsUrl(entry[field]),
        expected(`${location}.${field}`, 'an https:// link', entry[field]),
      ),
    ),
  ]
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}
