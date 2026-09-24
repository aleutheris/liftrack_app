import { describe, expect, it } from 'vitest'
import { assetsOf, attribute, servedWrong } from './page-assets.ts'

// What this parsing misreads, the live-site check would report as a healthy deploy, so it is tested
// on the tag shapes a build tool or a hand edit of index.html can produce.

// The page as a project site serves it: <owner>.github.io/<repo>/.
const site = 'https://owner.github.io/liftrack/'

/** Each asset as "<kind> <absolute url>", the two things the check goes on to use. */
function found(html: string): string[] {
  return assetsOf(html, site).map((asset) => `${asset.kind} ${asset.url.href}`)
}

describe('assetsOf', () => {
  it('reads the tags a Vite build writes, wherever the reference sits in the tag', () => {
    const html = [
      '<!doctype html><html><head>',
      '<script type="module" crossorigin src="./assets/index-abc.js"></script>',
      '<link rel="modulepreload" crossorigin href="./assets/vendor-def.js">',
      '<link rel="stylesheet" crossorigin href="./assets/index-ghi.css">',
      '<link rel="icon" type="image/svg+xml" href="./icon.svg">',
      '</head><body><div id="root"></div></body></html>',
    ].join('\n')
    expect(found(html)).toEqual([
      `script ${site}assets/index-abc.js`,
      `script ${site}assets/vendor-def.js`,
      `stylesheet ${site}assets/index-ghi.css`,
      `icon ${site}icon.svg`,
    ])
  })

  it('resolves a reference as the browser does, so a wrong base path is not quietly corrected', () => {
    // A build made with base "/" and served under /liftrack/: the browser asks the domain root,
    // where nothing is published. The check must ask for that same address and fail.
    expect(found('<script src="/assets/index-abc.js"></script>')).toEqual([
      'script https://owner.github.io/assets/index-abc.js',
    ])
    expect(found('<link rel="stylesheet" href="https://cdn.example/x.css">')).toEqual([
      'stylesheet https://cdn.example/x.css',
    ])
    // Relative to the page's folder, not to the site root: the page address is the base.
    const nested = assetsOf('<script src="index.js"></script>', `${site}day/index.html`)
    expect(nested.map((asset) => asset.url.href)).toEqual([`${site}day/index.js`])
  })

  it('accepts either quote character, or none', () => {
    expect(found("<link rel='stylesheet' href='./a.css'>")).toEqual([`stylesheet ${site}a.css`])
    expect(found('<link rel=icon href=./b.svg>')).toEqual([`icon ${site}b.svg`])
    expect(found('<script src=./c.js ></script>')).toEqual([`script ${site}c.js`])
  })

  it('reads uppercase tags and attribute names', () => {
    const html = '<SCRIPT SRC="./a.js"></SCRIPT><LINK REL="STYLESHEET" HREF="./b.css">'
    expect(found(html)).toEqual([`script ${site}a.js`, `stylesheet ${site}b.css`])
  })

  it('handles a rel naming several kinds, and a name it does not know', () => {
    expect(found('<link rel="stylesheet icon" href="./a.css">')).toEqual([`stylesheet ${site}a.css`])
    expect(found('<link rel="shortcut icon" href="./b.svg">')).toEqual([`icon ${site}b.svg`])
  })

  it('ignores a tag that references no file to check', () => {
    expect(found('<script>fetch("./inline.js")</script>'), 'an inline script').toEqual([])
    expect(found('<link href="./a.css">'), 'a link with no rel').toEqual([])
    expect(found('<link rel="stylesheet">'), 'a link with no href').toEqual([])
    expect(found('<link rel="preload" as="font" href="./f.woff2">'), 'a rel the check does not fetch').toEqual([])
  })

  it('does not read a longer attribute name as the one it wants', () => {
    expect(found('<script data-src="./a.js"></script>')).toEqual([])
    expect(found('<link data-rel="stylesheet" href="./b.css">')).toEqual([])
    expect(found('<script data-src="./a.js" src="./b.js"></script>')).toEqual([`script ${site}b.js`])
  })
})

/** The one asset a tag references, exactly as the check receives it from `assetsOf`. */
function one(tag: string) {
  const [asset] = assetsOf(tag, site)
  if (!asset) throw new Error(`no asset found in ${tag}`)
  return asset
}

describe('servedWrong', () => {
  const script = one('<script src="./a.js"></script>')
  const stylesheet = one('<link rel="stylesheet" href="./b.css">')
  const icon = one('<link rel="icon" href="./c.svg">')

  it('takes every content type a browser takes for that kind', () => {
    expect(servedWrong(script, 200, 'text/javascript; charset=utf-8')).toBeUndefined()
    expect(servedWrong(script, 200, 'application/javascript')).toBeUndefined()
    expect(servedWrong(stylesheet, 200, 'text/css; charset=utf-8')).toBeUndefined()
    expect(servedWrong(icon, 200, 'image/svg+xml')).toBeUndefined()
    expect(servedWrong(icon, 200, 'image/png')).toBeUndefined()
  })

  it('names what the kind needed when the server sent something else', () => {
    // Pages answers a path outside the build with its 404 page — which on a project site can arrive as
    // HTTP 200 and text/html, so the content type is the only thing that gives it away.
    expect(servedWrong(script, 200, 'text/html; charset=utf-8')).toBe(
      `${site}a.js is text/html; charset=utf-8, expected javascript`,
    )
    expect(servedWrong(stylesheet, 200, 'text/html')).toBe(`${site}b.css is text/html, expected text/css`)
    expect(servedWrong(icon, 200, 'text/html')).toBe(`${site}c.svg is text/html, expected image/`)
    // The check's stand-in when the response carries no content-type header at all.
    expect(servedWrong(icon, 200, 'no type')).toBe(`${site}c.svg is no type, expected image/`)
  })

  it('reports any status but 200, whatever the content type says', () => {
    expect(servedWrong(script, 404, 'text/html')).toBe(`${site}a.js answered HTTP 404, expected 200`)
    expect(servedWrong(stylesheet, 500, 'text/css')).toBe(`${site}b.css answered HTTP 500, expected 200`)
    expect(servedWrong(icon, 304, 'image/png')).toBe(`${site}c.svg answered HTTP 304, expected 200`)
  })
})

describe('attribute', () => {
  it('reads a value whatever its quoting, spacing and case', () => {
    expect(attribute('<link href="./a.css">', 'href')).toBe('./a.css')
    expect(attribute("<link href = './a.css'>", 'HREF')).toBe('./a.css')
    expect(attribute('<link HREF=./a.css>', 'href')).toBe('./a.css')
  })

  it('is undefined when the tag has no such attribute', () => {
    expect(attribute('<script type="module">', 'src')).toBeUndefined()
  })
})
