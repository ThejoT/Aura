export interface MidasAnswers {
  q1MissedWork: number;
  q2ReducedWork: number;
  q3MissedHousehold: number;
  q4ReducedHousehold: number;
  q5MissedSocial: number;
  headacheDaysLast3Months: number;
  avgPainLast3Months: number;
}

export interface MidasScore {
  totalScore: number;
  grade: 1 | 2 | 3 | 4;
  gradeLabel: string;
}

const GRADE_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Little or no disability',
  2: 'Mild disability',
  3: 'Moderate disability',
  4: 'Severe disability',
};

/** Standard 5-question MIDAS (Migraine Disability Assessment) scoring, days-missed-in-3-months based. */
export function scoreMidas(answers: MidasAnswers): MidasScore {
  const totalScore =
    answers.q1MissedWork +
    answers.q2ReducedWork +
    answers.q3MissedHousehold +
    answers.q4ReducedHousehold +
    answers.q5MissedSocial;

  let grade: 1 | 2 | 3 | 4;
  if (totalScore <= 5) grade = 1;
  else if (totalScore <= 10) grade = 2;
  else if (totalScore <= 20) grade = 3;
  else grade = 4;

  return { totalScore, grade, gradeLabel: GRADE_LABELS[grade] };
}

export const MIDAS_REMINDER_INTERVAL_MS = 90 * 24 * 60 * 60 * 1000; // ~3 months
