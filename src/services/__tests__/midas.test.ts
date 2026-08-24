import { scoreMidas } from '../midas';

function answers(overrides: Partial<Parameters<typeof scoreMidas>[0]> = {}) {
  return {
    q1MissedWork: 0,
    q2ReducedWork: 0,
    q3MissedHousehold: 0,
    q4ReducedHousehold: 0,
    q5MissedSocial: 0,
    headacheDaysLast3Months: 0,
    avgPainLast3Months: 0,
    ...overrides,
  };
}

describe('scoreMidas', () => {
  it('sums exactly the five disability questions, not the headache-day/pain fields', () => {
    const result = scoreMidas(
      answers({
        q1MissedWork: 2,
        q2ReducedWork: 1,
        q3MissedHousehold: 3,
        q4ReducedHousehold: 0,
        q5MissedSocial: 4,
        headacheDaysLast3Months: 50,
        avgPainLast3Months: 9,
      }),
    );
    expect(result.totalScore).toBe(10);
  });

  it.each([
    [0, 1],
    [5, 1],
    [6, 2],
    [10, 2],
    [11, 3],
    [20, 3],
    [21, 4],
    [90, 4],
  ])('grades a total of %i as grade %i', (total, expectedGrade) => {
    // Distribute the total across q1 so the sum matches exactly.
    const result = scoreMidas(answers({ q1MissedWork: total }));
    expect(result.grade).toBe(expectedGrade);
  });
});
