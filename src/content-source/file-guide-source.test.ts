import { readGuide } from './file-guide-source'

describe('readGuide', () => {
  it('returns no guide when the file is absent', () => {
    expect(readGuide(undefined)).toBeUndefined()
  })

  it('returns a valid guide as it is', () => {
    const guide = { title: 'T', sections: [{ heading: 'H', items: ['a'] }] }
    expect(readGuide(guide)).toEqual(guide)
  })

  it('drops a guide that fails the format, so the workouts still open', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(readGuide({ title: '', sections: [] })).toBeUndefined()
    expect(log).toHaveBeenCalledOnce()
    log.mockRestore()
  })
})
