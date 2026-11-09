import { contentWith, type Path } from './test-support/content-fixture'
import { validateContent } from './validate-content'

// Negative controls for guide.json (ADR-260008 amendment, ICR-260005): the file may be absent, but a
// guide that IS given must be whole, with no field the format does not define.
const SECTION = ['guide', 'sections', 0]
const TABLE = [...SECTION, 'table']
const AT = 'guide.json sections[0]'

describe('validateContent — guide.json', () => {
  it('accepts content with no guide.json at all, which shows no panel', () => {
    expect(validateContent(contentWith([['guide'], undefined]))).toEqual([])
  })

  it('rejects a guide that is not an object', () => {
    expect(validateContent(contentWith([['guide'], ['x']]))).toEqual([
      'guide.json: expected an object with "title" and "sections", found ["x"]',
    ])
  })

  it.each<[defect: string, path: Path, value: unknown, problem: string]>([
    ['no title', ['guide', 'title'], undefined, 'guide.json.title: expected a non-empty string, found nothing'],
    ['an unknown field', ['guide', 'year'], 1, 'guide.json: unknown field "year"'],
    ['no sections', ['guide', 'sections'], [], 'guide.json.sections: expected a non-empty list, found []'],
    ['a section with no heading', [...SECTION, 'heading'], '', `${AT}.heading: expected a non-empty string, found ""`],
    ['a section with an unknown field', [...SECTION, 'note'], 'x', `${AT}: unknown field "note"`],
    [
      'a section with both a table and items', [...SECTION, 'items'], ['a'],
      `${AT}: expected either "table" or "items", not both and not neither`,
    ],
    [
      'a section with neither', [...SECTION, 'table'], undefined,
      `${AT}: expected either "table" or "items", not both and not neither`,
    ],
    [
      'a section that is not an object', SECTION, 'text',
      `${AT}: expected an object with "heading" and a "table" or "items", found "text"`,
    ],
    ['a table that is not an object', TABLE, 'text', `${AT}.table: expected an object with "columns" and "rows", found "text"`],
    ['a table with no columns', [...TABLE, 'columns'], [], `${AT}.table.columns: expected a non-empty list of strings, found []`],
    ['a table with no rows', [...TABLE, 'rows'], [], `${AT}.table.rows: expected a non-empty list, found []`],
    [
      'a row with the wrong number of cells', [...TABLE, 'rows', 0], ['1'],
      `${AT}.table.rows[0]: expected a list of 2 strings, one per column, found ["1"]`,
    ],
    ['an empty cell', [...TABLE, 'rows', 0, 1], ' ', `${AT}.table.rows[0][1]: expected a non-empty string, found " "`],
    ['an empty column', [...TABLE, 'columns', 0], '', `${AT}.table.columns[0]: expected a non-empty string, found ""`],
    ['an unknown table field', [...TABLE, 'caption'], 'x', `${AT}.table: unknown field "caption"`],
    [
      'an empty line in a list', ['guide', 'sections', 1, 'items', 0], '',
      'guide.json sections[1].items[0]: expected a non-empty string, found ""',
    ],
  ])('rejects %s', (_defect, path, value, problem) => {
    expect(validateContent(contentWith([path, value]))).toEqual([problem])
  })
})
