import { contentWith, type Path } from './test-support/content-fixture'
import { validateContent } from './validate-content'

// Negative controls for picture-credits.json (ADR-260008 amendment, 2026-10-14): only pictures taken
// from elsewhere carry a credit, so the file may be absent, but a credit that IS given must be whole.
const CREDIT = ['credits', 'pallof-press-2.svg']
const AT = 'picture-credits.json pallof-press-2.svg'

describe('validateContent — picture-credits.json', () => {
  it('rejects a credits file that is not an object', () => {
    expect(validateContent(contentWith([['credits'], ['Everkinetic']]))).toEqual([
      'picture-credits.json: expected an object keyed by picture file name, found ["Everkinetic"]',
    ])
  })

  it.each<[defect: string, path: Path, value: unknown, problem: string]>([
    [
      'a credit for a file not in content/pictures/', ['credits', 'squat-1.png'],
      { author: 'A', license: 'L', licenseUrl: 'https://l.example', source: 'https://s.example' },
      'picture-credits.json squat-1.png: "squat-1.png" is not in content/pictures/',
    ],
    [
      'a credit that is not an object', CREDIT, 'Everkinetic',
      `${AT}: expected an object with "author", "license", "licenseUrl", "source", found "Everkinetic"`,
    ],
    ['an unknown field', [...CREDIT, 'year'], 2014, `${AT}: unknown field "year"`],
    ['a credit with no author', [...CREDIT, 'author'], undefined, `${AT}.author: expected a non-empty string, found nothing`],
    ['an empty license', [...CREDIT, 'license'], ' ', `${AT}.license: expected a non-empty string, found " "`],
    [
      'a source that is not a link', [...CREDIT, 'source'], 'github',
      `${AT}.source: expected an https:// link, found "github"`,
    ],
    [
      'a license link that is not https', [...CREDIT, 'licenseUrl'], 'javascript:alert(1)',
      `${AT}.licenseUrl: expected an https:// link, found "javascript:alert(1)"`,
    ],
  ])('rejects %s', (_defect, path, value, problem) => {
    expect(validateContent(contentWith([path, value]))).toEqual([problem])
  })

  it('accepts content with no picture-credits.json at all, as the owner’s own photos need no credit', () => {
    expect(validateContent(contentWith([['credits'], undefined]))).toEqual([])
  })

  it('lets the page ignore a credit for a picture not added yet, while CI fails it', () => {
    const credit = { author: 'A', license: 'L', licenseUrl: 'https://l.example', source: 'https://s.example' }
    const content = contentWith([['credits', 'squat-1.png'], credit])

    expect(validateContent(content, { picturesMustExist: false })).toEqual([])
  })
})
