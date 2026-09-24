import { expected, isObject, isSlug, isText, unknownFields, unless } from './json-checks'

/** Picture file name in content/pictures/ → size in bytes, or null where the size cannot be read. */
export type PictureSizes = ReadonlyMap<string, number | null>

const PICTURE_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.png', '.avif', '.svg']
// The picture budget of EPIC-260007, derived from REQ-QR-260002's 1.6 Mbps (about 200 KB/s): 40 KB
// is about 0.2 s. A picture is shown in a frame about 143 CSS px wide, so even a 3x phone screen
// shows 429 device px and a 600 px export — comfortably inside 40 KB — loses nothing visible.
const PICTURE_BYTES_MAX = 40 * 1024
// The build imports every picture by its path, where '#' or '?' breaks the import, and it reads no
// subfolders. Keeping names to these characters rules both out.
const PLAIN_FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/
const NOT_PLAIN =
  'is not a plain file name: use only letters, digits, ".", "_" and "-", starting with a letter or digit'

/** Checks content/exercises.json against ADR-260008's catalogue format. */
export function validateCatalogue(catalogue: unknown, pictureSizes: PictureSizes): string[] {
  if (!isObject(catalogue)) {
    return [expected('exercises.json', 'an object keyed by exercise slug', catalogue)]
  }
  return Object.entries(catalogue).flatMap(([slug, entry]) =>
    validateExercise(slug, entry, pictureSizes),
  )
}

function validateExercise(slug: string, entry: unknown, pictureSizes: PictureSizes): string[] {
  const location = `exercises.json ${slug}`
  const keyProblems = unless(
    isSlug(slug),
    `${location}: ${JSON.stringify(slug)} is not a slug such as "leg-press"`,
  )
  if (!isObject(entry)) {
    return [...keyProblems, expected(location, 'an object with "name" and "pictures"', entry)]
  }
  return [
    ...keyProblems,
    ...unknownFields(location, entry, ['name', 'cue', 'pictures']),
    ...unless(isText(entry.name), expected(`${location}.name`, 'a non-empty string', entry.name)),
    ...unless(
      entry.cue === undefined || isText(entry.cue),
      expected(`${location}.cue`, 'a non-empty string', entry.cue),
    ),
    ...validatePictures(`${location}.pictures`, entry.pictures, pictureSizes),
  ]
}

function validatePictures(location: string, pictures: unknown, sizes: PictureSizes): string[] {
  // A photo that has not been taken yet is simply absent: the page shows that slot as missing, so a
  // day is never held back by a picture. A name that IS given must be a file, so a typo still fails.
  if (pictures === undefined) {
    return []
  }
  if (!Array.isArray(pictures) || pictures.length > 2) {
    return [expected(location, 'a list of up to two picture files', pictures)]
  }
  const [first, second] = pictures
  if (isText(first) && first === second) {
    // One file named twice has one set of problems; checking [1] as well would list each of them twice.
    return [
      `${location}: both pictures are ${JSON.stringify(first)}; use two different files`,
      ...validatePicture(`${location}[0]`, first, sizes),
    ]
  }
  return pictures.flatMap((file, index) => validatePicture(`${location}[${index}]`, file, sizes))
}

/**
 * One problem per file in content/pictures/ whose name could break the build, even if no exercise
 * uses it. Hidden files such as ".DS_Store" are skipped: the build's import skips them too.
 */
export function unsafePictureNames(fileNames: Iterable<string>): string[] {
  return [...fileNames]
    .filter((fileName) => !fileName.startsWith('.') && !PLAIN_FILE_NAME.test(fileName))
    .map((fileName) => `content/pictures/: ${JSON.stringify(fileName)} ${NOT_PLAIN}`)
}

// Reports only the first failing check: a file with the wrong extension is not also "missing".
function validatePicture(location: string, file: unknown, sizes: PictureSizes): string[] {
  if (!isText(file)) {
    return [expected(location, 'a picture file name', file)]
  }
  const name = JSON.stringify(file)
  if (!PLAIN_FILE_NAME.test(file)) {
    return [`${location}: ${name} ${NOT_PLAIN}`]
  }
  if (!PICTURE_EXTENSIONS.some((extension) => file.endsWith(extension))) {
    return [`${location}: ${name} is not a ${PICTURE_EXTENSIONS.join(', ')} file`]
  }
  const size = sizes.get(file)
  if (size === undefined) {
    return [`${location}: ${name} is not in content/pictures/`]
  }
  return unless(
    size === null || size <= PICTURE_BYTES_MAX,
    `${location}: ${name} is ${size} bytes, over the ${PICTURE_BYTES_MAX}-byte picture budget`,
  )
}
