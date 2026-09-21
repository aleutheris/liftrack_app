import { describe, expect, it } from 'vitest'

// Module boundaries (project-instructions §2, EPIC-260007), checked on the source text, so a stray
// import fails the unit suite instead of waiting for a review to notice it.

interface Edge {
  file: string
  specifier: string
  from: string
  to: string
}

interface Rule {
  name: string
  applies: (edge: Edge) => boolean
  allows: (edge: Edge) => boolean
  /** A file that breaks the rule, proving the rule can fail. */
  counterexample: Record<string, string>
}

const thisFile = './architecture.test.ts'
const sources = import.meta.glob<string>('./**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true })

// A specifier may sit in any quote, a template literal included, and comments may come before it.
// Comments are skipped where they can appear, never stripped from the source first: stripping
// `/* … */` would also cut into glob strings such as './**/*.ts'.
const importPatterns = [
  /^[ \t]*(?:import|export)\s(?:[\w\s{},*$]|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*?\bfrom\s*['"`]([^'"`]+)['"`]/gm,
  /^[ \t]*import\s*['"`]([^'"`]+)['"`]/gm,
  /\bimport\s*\(\s*(?:(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)\s*)*['"`]([^'"`]+)['"`]/g,
  /\bnew\s+URL\(\s*['"`]([^'"`]+)['"`]\s*,\s*import\.meta\.url\b/g,
]
const globPattern = /import\.meta\.glob(?:<[^>]*>)?\(\s*(\[[^\]]*\]|'[^']*'|"[^"]*"|`[^`]*`)/g

function importSpecifiers(source: string): string[] {
  const specifiers = importPatterns.flatMap((pattern) => [...source.matchAll(pattern)].map((m) => m[1] ?? ''))
  const globs = [...source.matchAll(globPattern)].flatMap((m) => [...(m[1] ?? '').matchAll(/['"`]!?([^'"`]+)['"`]/g)])
  return [...specifiers, ...globs.map((m) => m[1] ?? '')]
}

/** `features/<slice>` for a feature, the folder under src for other modules, `src` for its root files. */
function moduleOf(path: string): string {
  const [top, area, slice] = path.split('/')
  if (top !== 'src') return top === 'content' ? 'content' : 'outside-src'
  if (area === 'features') return `features/${slice}`
  return path.split('/').length === 2 ? 'src' : (area ?? 'src')
}

function edgesOf(files: Record<string, string>): Edge[] {
  return Object.entries(files).flatMap(([file, source]) =>
    importSpecifiers(source)
      .filter((specifier) => /^[./]/.test(specifier)) // packages are not modules of this project
      .map((specifier) => {
        const target = new URL(specifier, `file:///${file}`).pathname.slice(1)
        return { file, specifier, from: moduleOf(file), to: moduleOf(target) }
      }),
  )
}

function violations(rule: Rule, edges: Edge[]): string[] {
  return edges.filter((e) => rule.applies(e) && !rule.allows(e)).map((e) => `${e.file} imports '${e.specifier}'`)
}

const rules: Rule[] = [
  {
    name: 'src/workout imports nothing outside itself',
    applies: (e) => e.from === 'workout',
    allows: (e) => e.to === 'workout',
    counterexample: { 'src/workout/types.ts': "import type { X } from '../features/today-workout/x'" },
  },
  {
    name: 'src/content-source never imports a feature or the app shell',
    applies: (e) => e.from === 'content-source',
    allows: (e) => !e.to.startsWith('features/') && e.to !== 'app-shell',
    counterexample: { 'src/content-source/source.ts': "import { App } from '../app-shell/App'" },
  },
  {
    name: 'a feature imports only its own slice, src/workout and src/ui-primitives',
    applies: (e) => e.from.startsWith('features/'),
    allows: (e) => e.to === e.from || e.to === 'workout' || e.to === 'ui-primitives',
    counterexample: { 'src/features/today-workout/day.tsx': "import { source } from '../../content-source/source'" },
  },
  {
    name: 'src/ui-primitives imports nothing project-specific',
    applies: (e) => e.from === 'ui-primitives',
    allows: (e) => e.to === 'ui-primitives',
    counterexample: { 'src/ui-primitives/button.tsx': "import type { Exercise } from '../workout/types'" },
  },
  {
    name: 'only src/main.tsx imports src/content-source from outside it',
    applies: (e) => e.file !== 'src/main.tsx' && e.from !== 'content-source',
    allows: (e) => e.to !== 'content-source',
    counterexample: { 'src/app-shell/App.tsx': "const s = await import('../content-source/source')" },
  },
  {
    // ADR-260008's rollback deletes content/ with the file-backed source and nothing else.
    name: 'only src/content-source reads content/',
    applies: (e) => e.from !== 'content-source',
    allows: (e) => e.to !== 'content',
    counterexample: { 'src/app-shell/App.tsx': "import plan from '../../content/plan.json'" },
  },
]

const projectFiles = Object.fromEntries(
  Object.entries(sources)
    .filter(([key]) => key !== thisFile)
    .map(([key, source]) => [`src/${key.slice(2)}`, source]),
)

describe('module boundaries', () => {
  it.each(rules)('$name', (rule) => {
    expect(violations(rule, edgesOf(projectFiles))).toEqual([])
  })

  it.each(rules)('catches a break of: $name', (rule) => {
    expect(violations(rule, edgesOf(rule.counterexample))).toHaveLength(1)
  })

  it('reads the source of every module', () => {
    expect(Object.keys(projectFiles)).toEqual(expect.arrayContaining(['src/main.tsx', 'src/workout/types.ts']))
  })

  it('finds every form of import', () => {
    const source = [
      "import type { A } from './a'",
      'import {\n  b,\n  c,\n} from "../b"',
      "export * from './c'",
      "import './d.css'",
      "const e = await import('./e')",
      "const f = import.meta.glob<string>(['../f/*.json', '!../f/skip.json'], { eager: true })",
      "import { useState } from 'react'",
      'export const g = items.map((item) => item.from)',
      "import {\n  h, // why\n  /* note */ i,\n} from '../h'",
      "const j = await import(/* @vite-ignore */ './j')",
      'const k = await import(`./k`)',
      'const l = import.meta.glob(`../l/*.json`)',
      "const m = new URL('../m/a.svg', import.meta.url)",
    ].join('\n')
    expect(importSpecifiers(source).sort()).toEqual(
      [
        ...['./a', '../b', './c', './d.css', './e', '../f/*.json', '../f/skip.json', 'react'],
        ...['../h', './j', './k', '../l/*.json', '../m/a.svg'],
      ].sort(),
    )
  })
})
