// The half of the live-site check (scripts/check-live-site.ts) that needs no network: which files a
// page's HTML references, and whether one of them was served as a browser needs it. In a module of its
// own so it can be unit-tested — that script fetches the site and retries as soon as it is imported.

// A browser refuses a module script or a stylesheet served as anything else, e.g. an HTML fallback,
// and shows no icon for a file that is not an image.
const expectedType = { script: 'javascript', stylesheet: 'text/css', icon: 'image/' }

type Asset = { url: URL; kind: keyof typeof expectedType }

// The tags Vite writes: <script src>, and <link href> for stylesheets, module preloads and the icon.
// Each URL is resolved against the page's own address, as a browser does, so a wrong base path fails.
// A rel naming several kinds is fetched once, as the first kind below that it names.
export function assetsOf(html: string, pageAddress: string): Asset[] {
  const assets: Asset[] = []
  for (const [tag] of html.matchAll(/<(?:script|link)\b[^>]*>/gi)) {
    const rel = (attribute(tag, 'rel') ?? '').toLowerCase().split(/\s+/)
    const src = attribute(tag, 'src')
    const href = attribute(tag, 'href')
    if (src) assets.push({ url: new URL(src, pageAddress), kind: 'script' })
    else if (href && rel.includes('modulepreload')) assets.push({ url: new URL(href, pageAddress), kind: 'script' })
    else if (href && rel.includes('stylesheet')) assets.push({ url: new URL(href, pageAddress), kind: 'stylesheet' })
    else if (href && rel.includes('icon')) assets.push({ url: new URL(href, pageAddress), kind: 'icon' })
  }
  return assets
}

// What is wrong with the way one reference was served, or nothing when a browser would take it. The
// content type only has to contain what the kind needs: servers add a charset, and JavaScript arrives
// as text/javascript or application/javascript. A wrong status is reported on its own — a file that is
// not there says nothing useful about content types.
export function servedWrong(asset: Asset, status: number, contentType: string): string | undefined {
  if (status !== 200) return `${asset.url} answered HTTP ${status}, expected 200`
  const expected = expectedType[asset.kind]
  if (!contentType.includes(expected)) return `${asset.url} is ${contentType}, expected ${expected}`
  return undefined
}

// One attribute of one start tag, in any of HTML's quotings. The whitespace the name must follow
// keeps a longer name from matching it, so `data-src` is not read as `src`.
export function attribute(tag: string, name: string): string | undefined {
  const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag)
  return match?.slice(1).find((value) => value !== undefined)
}
