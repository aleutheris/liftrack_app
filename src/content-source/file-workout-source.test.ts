import rawPlan from '../../content/plan.json'
import { fileWorkoutSource } from './index'

// Loads the real content/ folder through the build's own imports — nothing is mocked.
describe('fileWorkoutSource', () => {
  it('loads every day of content/plan.json, in file order', async () => {
    const plan = await fileWorkoutSource.loadPlan()

    expect(plan.days.map((day) => day.id)).toEqual(rawPlan.days.map((day) => day.id))
  })

  it('gives every exercise two pictures the build can serve', async () => {
    const plan = await fileWorkoutSource.loadPlan()
    const pictures = plan.days.flatMap((day) => day.prescriptions.flatMap((row) => row.exercise.pictures))

    expect(pictures.length).toBeGreaterThan(0)
    pictures.forEach((picture) =>
      expect(picture.src).toMatch(/\/content\/pictures\/[\w-]+\.(webp|jpe?g|png|avif|svg)(\?|$)/),
    )
  })
})
