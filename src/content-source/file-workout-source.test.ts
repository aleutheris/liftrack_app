import rawPlan from '../../content/plan.json'
import { fileWorkoutSource } from './index'

// Loads the real content/ folder through the build's own imports — nothing is mocked.
describe('fileWorkoutSource', () => {
  it('loads every day of content/plan.json, in file order', async () => {
    const plan = await fileWorkoutSource.loadPlan()

    expect(plan.days.map((day) => day.id)).toEqual(rawPlan.days.map((day) => day.id))
  })

  it('gives every exercise two picture slots, each either a photo the build serves or missing', async () => {
    const plan = await fileWorkoutSource.loadPlan()
    const exercises = plan.days.flatMap((day) => day.prescriptions.map((row) => row.exercise))

    expect(exercises.length).toBeGreaterThan(0)
    exercises.forEach((exercise) => expect(exercise.pictures).toHaveLength(2))
    // Empty while the owner is still taking the photos; each one added must resolve to a served file.
    exercises
      .flatMap((exercise) => exercise.pictures)
      .filter((picture) => picture !== null)
      .forEach((picture) =>
        expect(picture.src).toMatch(/\/content\/pictures\/[\w-]+\.(webp|jpe?g|png|avif|svg)(\?|$)/),
      )
  })
})
