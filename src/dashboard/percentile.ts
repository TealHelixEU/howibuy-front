/**
 * The lowest XP percentile the dashboard shows. A user behind most shoppers is not told so: below it the XP tile shows
 * the total alone, and the comparison appears once they pass it. The API sends the percentile whatever its value.
 */
export const PERCENTILE_SHOWN_FROM = 20;

/** The user's XP percentile when the dashboard shows it, or null when it does not. */
export function shownPercentile(xpPercentile: number | null): number | null {
	return xpPercentile !== null && xpPercentile >= PERCENTILE_SHOWN_FROM ? xpPercentile : null;
}
