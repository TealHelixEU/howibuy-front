import type { SustainabilityDimension } from './sfc';

/**
 * The dimensions in the order the compass shows them. The API orders categories by the dimension's stored name, which is
 * alphabetical in no language a user reads, so the order they are met in is decided here.
 */
const ORDER: readonly SustainabilityDimension[] = ['ECOLOGICAL', 'SOCIAL', 'ECONOMIC', 'HEALTH', 'ANIMAL_WELFARE'];

/**
 * The given items in the order the compass shows them: by dimension, and within one dimension in the order they came,
 * since sorting keeps equals as they were. A dimension this application has not been taught about goes last, where it is
 * noticed rather than mistaken for the most important one.
 */
export function inPresentationOrder<T>(items: readonly T[], dimensionOf: (item: T) => SustainabilityDimension): T[] {
	return [...items].sort((a, b) => rankOf(dimensionOf(a)) - rankOf(dimensionOf(b)));
}

function rankOf(dimension: SustainabilityDimension): number {
	const rank = ORDER.indexOf(dimension);
	return rank === -1 ? ORDER.length : rank;
}
