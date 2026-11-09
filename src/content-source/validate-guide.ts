import { expected, isObject, isText, unknownFields, unless } from './json-checks'

const GUIDE_FIELDS = ['title', 'sections'] as const
const SECTION_FIELDS = ['heading', 'table', 'items'] as const
const TABLE_FIELDS = ['columns', 'rows'] as const

/** Checks content/guide.json (ADR-260008 amendment, ICR-260005). Absent entirely is fine: no panel. */
export function validateGuide(guide: unknown): string[] {
  if (guide === undefined) {
    return []
  }
  if (!isObject(guide)) {
    return [expected('guide.json', 'an object with "title" and "sections"', guide)]
  }
  const sections = guide.sections
  return [
    ...unknownFields('guide.json', guide, GUIDE_FIELDS),
    ...unless(isText(guide.title), expected('guide.json.title', 'a non-empty string', guide.title)),
    ...(Array.isArray(sections) && sections.length > 0
      ? sections.flatMap((section, i) => validateSection(`guide.json sections[${i}]`, section))
      : [expected('guide.json.sections', 'a non-empty list', sections)]),
  ]
}

function validateSection(location: string, section: unknown): string[] {
  if (!isObject(section)) {
    return [expected(location, 'an object with "heading" and a "table" or "items"', section)]
  }
  const hasTable = section.table !== undefined
  const hasItems = section.items !== undefined
  return [
    ...unknownFields(location, section, SECTION_FIELDS),
    ...unless(isText(section.heading), expected(`${location}.heading`, 'a non-empty string', section.heading)),
    ...unless(hasTable !== hasItems, `${location}: expected either "table" or "items", not both and not neither`),
    ...(hasTable ? validateTable(`${location}.table`, section.table) : []),
    ...(hasItems ? validateTexts(`${location}.items`, section.items) : []),
  ]
}

function validateTexts(location: string, value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [expected(location, 'a non-empty list of strings', value)]
  }
  return value.flatMap((text, i) => unless(isText(text), expected(`${location}[${i}]`, 'a non-empty string', text)))
}

function validateTable(location: string, table: unknown): string[] {
  if (!isObject(table)) {
    return [expected(location, 'an object with "columns" and "rows"', table)]
  }
  const { columns, rows } = table
  const columnProblems = validateTexts(`${location}.columns`, columns)
  if (!Array.isArray(rows) || rows.length === 0) {
    return [...unknownFields(location, table, TABLE_FIELDS), ...columnProblems, expected(`${location}.rows`, 'a non-empty list', rows)]
  }
  if (columnProblems.length > 0) {
    return [...unknownFields(location, table, TABLE_FIELDS), ...columnProblems] // rows are judged against valid columns
  }
  const width = (columns as readonly unknown[]).length
  return [
    ...unknownFields(location, table, TABLE_FIELDS),
    ...columnProblems,
    ...rows.flatMap((row, i) => {
      const at = `${location}.rows[${i}]`
      return Array.isArray(row) && row.length === width
        ? validateTexts(at, row)
        : [expected(at, `a list of ${width} strings, one per column`, row)]
    }),
  ]
}
