import { contentWith, type Path } from './test-support/content-fixture'
import { unsafePictureNames } from './validate-catalogue'
import { validateContent } from './validate-content'

// Negative controls for exercises.json and content/pictures/ (ADR-260008): each case changes one value
// of valid content, and the check must report exactly that defect.
const LEG_PRESS = ['exercises', 'leg-press']
const AT = 'exercises.json leg-press'
const NOT_PLAIN =
  'is not a plain file name: use only letters, digits, ".", "_" and "-", starting with a letter or digit'

describe('validateContent — exercises.json and picture defects', () => {
  it.each<[defect: string, path: Path, value: unknown, problem: string]>([
    [
      'an exercise key that is not a slug', ['exercises', 'Leg Press'],
      { name: 'Leg press', pictures: ['leg-press-1.webp', 'leg-press-2.jpg'] },
      'exercises.json Leg Press: "Leg Press" is not a slug such as "leg-press"',
    ],
    [
      'an entry that is not an object (a stray top-level field)', ['exercises', 'comment'], 'Days 1 to 3',
      'exercises.json comment: expected an object with "name" and "pictures", found "Days 1 to 3"',
    ],
    [
      'an unknown field on an exercise', [...LEG_PRESS, 'cues'], 'Slow',
      `${AT}: unknown field "cues"`,
    ],
    [
      'an exercise with no name', [...LEG_PRESS, 'name'], undefined,
      `${AT}.name: expected a non-empty string, found nothing`,
    ],
    [
      'an exercise with an empty name', [...LEG_PRESS, 'name'], '',
      `${AT}.name: expected a non-empty string, found ""`,
    ],
    [
      'a cue that is present but empty', [...LEG_PRESS, 'cue'], '',
      `${AT}.cue: expected a non-empty string, found ""`,
    ],
    [
      'an exercise with three pictures', [...LEG_PRESS, 'pictures'], ['a.webp', 'b.webp', 'c.webp'],
      `${AT}.pictures: expected a list of up to two picture files, found ["a.webp","b.webp","c.webp"]`,
    ],
    [
      'pictures written as one file name rather than a list', [...LEG_PRESS, 'pictures'], 'leg-press-1.webp',
      `${AT}.pictures: expected a list of up to two picture files, found "leg-press-1.webp"`,
    ],
    [
      'an exercise with the same picture twice', [...LEG_PRESS, 'pictures', 1], 'leg-press-1.webp',
      `${AT}.pictures: both pictures are "leg-press-1.webp"; use two different files`,
    ],
    [
      'a picture with an empty file name', [...LEG_PRESS, 'pictures', 0], '',
      `${AT}.pictures[0]: expected a picture file name, found ""`,
    ],
    [
      'a picture in a subfolder', [...LEG_PRESS, 'pictures', 1], 'legs/leg-press-2.jpg',
      `${AT}.pictures[1]: "legs/leg-press-2.jpg" ${NOT_PLAIN}`,
    ],
    [
      'a missing picture file', ['pictureSizes', 'leg-press-2.jpg'], undefined,
      `${AT}.pictures[1]: "leg-press-2.jpg" is not in content/pictures/`,
    ],
    [
      'a picture over 40 KB', ['pictureSizes', 'leg-press-1.webp'], 40_961,
      `${AT}.pictures[0]: "leg-press-1.webp" is 40961 bytes, over the 40960-byte picture budget`,
    ],
  ])('rejects %s', (_defect, path, value, problem) => {
    expect(validateContent(contentWith([path, value]))).toEqual([problem])
  })

  it('passes two different pictures, even ones whose names differ only in the extension', () => {
    const content = contentWith(
      [[...LEG_PRESS, 'pictures', 1], 'leg-press-1.jpg'],
      [['pictureSizes', 'leg-press-1.jpg'], 900],
    )

    expect(validateContent(content)).toEqual([])
  })

  it('reports what is wrong with a picture used twice once, not once per use', () => {
    const content = contentWith([[...LEG_PRESS, 'pictures'], ['leg-press-3.webp', 'leg-press-3.webp']])

    expect(validateContent(content)).toEqual([
      `${AT}.pictures: both pictures are "leg-press-3.webp"; use two different files`,
      `${AT}.pictures[0]: "leg-press-3.webp" is not in content/pictures/`,
    ])
  })

  it('reports two empty picture names as two missing names, not as the same picture twice', () => {
    expect(validateContent(contentWith([[...LEG_PRESS, 'pictures'], ['', '']]))).toEqual([
      `${AT}.pictures[0]: expected a picture file name, found ""`,
      `${AT}.pictures[1]: expected a picture file name, found ""`,
    ])
  })

  // A photo that has not been taken yet is simply absent: the page shows that slot as missing, so no
  // day is held back waiting for a picture. A name that IS given must still be a file (below).
  it.each<[said: string, pictures: unknown]>([
    ['no pictures field at all', undefined],
    ['an empty list of pictures', []],
    ['one picture and one still to come', ['leg-press-1.webp']],
  ])('accepts an exercise with %s', (_said, pictures) => {
    expect(validateContent(contentWith([[...LEG_PRESS, 'pictures'], pictures]))).toEqual([])
  })

  it('rejects a picture whose extension is not an allowed image type, even when the file exists', () => {
    const content = contentWith(
      [[...LEG_PRESS, 'pictures', 0], 'leg-press-1.gif'],
      [['pictureSizes', 'leg-press-1.gif'], 900],
    )

    expect(validateContent(content)).toEqual([
      `${AT}.pictures[0]: "leg-press-1.gif" is not a .webp, .jpg, .jpeg, .png, .avif, .svg file`,
    ])
  })

  it.each(['leg-press#1.webp', 'leg-press?1.webp', 'leg press 1.webp'])(
    'rejects the picture %j even though the file exists, as the build cannot import it',
    (fileName) => {
      const content = contentWith([[...LEG_PRESS, 'pictures', 0], fileName], [['pictureSizes', fileName], 900])

      expect(validateContent(content)).toEqual([`${AT}.pictures[0]: ${JSON.stringify(fileName)} ${NOT_PLAIN}`])
    },
  )

  it('rejects an exercises.json that is not an object, and so every row that names an exercise', () => {
    expect(validateContent(contentWith([['exercises'], ['leg-press']]))).toEqual([
      'exercises.json: expected an object keyed by exercise slug, found ["leg-press"]',
      'plan.json days[0].exercises[0].exercise: "leg-press" is not in exercises.json',
      'plan.json days[0].exercises[1].exercise: "pallof-press" is not in exercises.json',
      'plan.json days[1].exercises[0].exercise: "leg-press" is not in exercises.json',
    ])
  })
})

describe('unsafePictureNames — every file in content/pictures/, used or not', () => {
  it('passes plain names, and skips hidden files, which the build never imports', () => {
    expect(unsafePictureNames(['leg-press-1.webp', 'Leg_Press.2.JPG', '1.svg', '.DS_Store'])).toEqual([])
  })

  it.each([
    ['a "#"', 'leg-press#1.svg'],
    ['a "?"', 'leg-press?1.svg'],
    ['a space', 'leg press 1.svg'],
    ['a folder', 'legs/leg-press-1.svg'],
    ['a leading "-"', '-leg-press-1.svg'],
    ['a letter outside A to Z', 'lég-press-1.svg'],
  ])('reports a name with %s, naming the file', (_case, fileName) => {
    expect(unsafePictureNames(['leg-press-1.svg', fileName])).toEqual([
      `content/pictures/: "${fileName}" ${NOT_PLAIN}`,
    ])
  })
})
