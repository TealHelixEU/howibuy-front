/**
 * The compass's own estimate of how long something takes, in whole minutes. What the API gives is the estimate for
 * answering every question of a category or of the whole compass — not for the ones left — so it is shown where deciding
 * whether to begin is the question. Anything that takes any time at all reads as at least a minute.
 */
export function estimatedMinutes(seconds: number): number {
	return Math.max(1, Math.round(seconds / 60));
}
