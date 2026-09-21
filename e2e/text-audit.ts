export interface TextSample {
  text: string
  fontSize: number
  contrast: number
  /** Inside the set or rep count, which REQ-QR-260001 holds to a higher bar. */
  isCount: boolean
  /** Inside a disabled control; WCAG 1.4.3 exempts inactive components from contrast. */
  inactive: boolean
}

/**
 * Measures every visible text node on the page. It runs in the browser — `page.evaluate` sends its
 * source text — so every helper it uses is defined inside it. Colours are read back through a
 * canvas, so any CSS colour syntax resolves to sRGB. Backgrounds are composited up the ancestor
 * chain over the browser's white canvas; background images are not considered.
 */
export function sampleVisibleText(): TextSample[] {
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('no 2D canvas to resolve colours with')
  const toRgba = (color: string): number[] => {
    context.clearRect(0, 0, 1, 1)
    context.fillStyle = color
    context.fillRect(0, 0, 1, 1)
    const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data
    return [r, g, b, a / 255]
  }
  const over = ([r = 0, g = 0, b = 0, a = 1]: number[], below: number[]): number[] =>
    [r, g, b].map((channel, i) => channel * a + (below[i] ?? 255) * (1 - a))
  const ancestry = (element: Element): Element[] => {
    const chain: Element[] = []
    for (let e: Element | null = element; e; e = e.parentElement) chain.unshift(e)
    return chain
  }
  const backgroundOf = (element: Element): number[] =>
    ancestry(element).reduce((below, e) => over(toRgba(getComputedStyle(e).backgroundColor), below), [255, 255, 255])
  const opacityOf = (element: Element): number =>
    ancestry(element).reduce((opacity, e) => opacity * parseFloat(getComputedStyle(e).opacity), 1)
  const luminance = (rgb: number[]): number => {
    const [r = 0, g = 0, b = 0] = rgb.map((v) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const contrast = (a: number[], b: number[]): number => {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
    return (light + 0.05) / (dark + 0.05)
  }

  const samples: TextSample[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement
    const text = node.textContent?.trim()
    if (!element || !text || element.getClientRects().length === 0) continue
    const style = getComputedStyle(element)
    if (style.visibility !== 'visible') continue
    const background = backgroundOf(element)
    const [r = 0, g = 0, b = 0, a = 1] = toRgba(style.color)
    samples.push({
      text,
      fontSize: parseFloat(style.fontSize),
      contrast: contrast(over([r, g, b, a * opacityOf(element)], background), background),
      isCount: element.closest('[data-testid="sets"], [data-testid="reps"]') !== null,
      inactive: element.closest(':disabled') !== null,
    })
  }
  return samples
}
