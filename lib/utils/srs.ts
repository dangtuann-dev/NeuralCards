export interface SRSResult {
  newInterval: number;
  newEaseFactor: number;
  newRepetitions: number;
  dueDate: Date;
  status: 'new' | 'learning' | 'review' | 'mastered';
}

/**
 * SM-2 Spaced Repetition Algorithm
 * quality: 0 = blackout, 1 = wrong, 2 = hard wrong, 3 = hard correct, 4 = correct, 5 = easy
 */
export function calculateNextReview(
  quality: 0 | 1 | 2 | 3 | 4 | 5,
  easeFactor: number,
  interval: number,
  repetitions: number
): SRSResult {
  const MIN_EASE = 1.3;
  const MAX_EASE = 2.5;
  
  let newRepetitions = repetitions;
  let newInterval = interval;
  let newEaseFactor = easeFactor;

  if (quality < 3) {
    // Incorrect response — reset
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Correct response
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions += 1;
  }

  // Update ease factor
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(MIN_EASE, Math.min(MAX_EASE, newEaseFactor));

  // Determine status
  let status: SRSResult['status'];
  if (newRepetitions === 0) status = quality < 3 ? 'learning' : 'new';
  else if (newRepetitions < 3) status = 'learning';
  else if (newInterval < 21) status = 'review';
  else status = 'mastered';

  // Calculate due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + newInterval);

  return { newInterval, newEaseFactor, newRepetitions, dueDate, status };
}

export function getQualityFromRating(rating: 'again' | 'hard' | 'good' | 'easy'): 0 | 1 | 2 | 3 | 4 | 5 {
  return { again: 1, hard: 2, good: 4, easy: 5 }[rating] as 0 | 1 | 2 | 3 | 4 | 5;
}
