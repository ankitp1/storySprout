// Compute the current listening streak from an array of 'YYYY-MM-DD' day strings.
// A streak is consecutive days ending today or yesterday (so it isn't broken
// before the child has had a chance to listen today).
export function getListeningStreak(days) {
  if (!days || days.length === 0) return 0;

  const daySet = new Set(days);
  const msPerDay = 24 * 60 * 60 * 1000;
  const toKey = (d) => d.toISOString().slice(0, 10);

  let cursor = new Date();
  if (!daySet.has(toKey(cursor))) {
    cursor = new Date(cursor.getTime() - msPerDay);
    if (!daySet.has(toKey(cursor))) return 0;
  }

  let streak = 0;
  while (daySet.has(toKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - msPerDay);
  }
  return streak;
}
