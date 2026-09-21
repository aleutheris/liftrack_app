import { expected, isObject, isSlug, isText, unknownFields, unless } from './json-checks'

/** Picture file name in content/pictures/ → size in bytes, or null where the size cannot be read. */
export type PictureSizes = ReadonlyMap<string, number | null>

const PICTURE_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.png', '.avif', '.svg']
// EPIC-260007's picture budget: about 0.5 s per picture at REQ-QR-260002's 1.6 Mbps.
const PICTURE_BYTES_MAX = 102_400
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
  if (!Array.isArray(pictures) || pictures.length !== 2) {
    return [expected(location, 'a list of exactly two picture files', pictures)]
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
