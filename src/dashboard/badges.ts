import type { BadgeLevel, BadgeSeries } from './dashboard';
import { inCompassOrder } from './dimensions';

/** A badge not held yet, and how many more products scoring high in its dimension it takes. */
export interface BadgeToGo {
	level: BadgeLevel;
	/** 0 for a count already past the badge's number: a lowered number, which the next basket awards. */
	toGo: number;
}

/** How many badges the user holds, of how many there are, across the series. */
export function badgeTally(series: readonly BadgeSeries[]): { earned: number; all: number } {
	const levels = series.flatMap((one) => one.levels);
	return { earned: levels.filter((level) => level.earned).length, all: levels.length };
}

/** The badge of a series to be earned next: its lowest level not held, or none when all are. */
export function nextBadge(series: BadgeSeries): BadgeToGo | undefined {
	const level = series.levels.find((one) => !one.earned);
	return level === undefined ? undefined : { level, toGo: Math.max(0, level.requiredProducts - series.productCount) };
}

/**
 * The badge closest to being earned: of the series' next badges, the one with the fewest products to go; on a tie, the
 * first in the order the dashboard shows the series. None once every badge is held.
 */
export function closestBadge(series: readonly BadgeSeries[]): BadgeToGo | undefined {
	let closest: BadgeToGo | undefined;
	for (const next of inCompassOrder(series, (one) => one.dimension).map(nextBadge)) {
		if (next !== undefined && (closest === undefined || next.toGo < closest.toGo)) {
			closest = next;
		}
	}
	return closest;
}
