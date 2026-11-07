import { describe, expect, it } from 'vitest';
import { closestBadge } from './badges';
import type { BadgeSeries, ScoredSustainabilityDimension } from './dashboard';

const CODES: Record<ScoredSustainabilityDimension, string> = {
	ENVIRONMENT: 'ENVIRONMENTAL_HERO',
	ANIMAL_WELFARE: 'ANIMAL_WELFARE_HERO',
	SOCIO_ECONOMIC: 'SOCIO_ECONOMIC_HERO',
	HEALTH: 'HEALTH_HERO',
};

/** A series at the badge numbers of today, 50, 100 and 200, with the first {@link held} of its levels earned. */
function series(dimension: ScoredSustainabilityDimension, productCount: number, held: number): BadgeSeries {
	return {
		dimension,
		productCount,
		levels: [50, 100, 200].map((requiredProducts, index) => ({
			badge: `${CODES[dimension]}_${index + 1}` as BadgeSeries['levels'][number]['badge'],
			label: `${CODES[dimension]} level ${index + 1}`,
			requiredProducts,
			earned: index < held,
		})),
	};
}

describe('the badge closest to being earned', () => {
	it('is the next badge with the fewest products to go, across the series', () => {
		const closest = closestBadge([
			series('ENVIRONMENT', 193, 2),
			series('ANIMAL_WELFARE', 163, 2),
			series('SOCIO_ECONOMIC', 182, 2),
			series('HEALTH', 57, 1),
		]);

		expect(closest?.level.badge).toBe('ENVIRONMENTAL_HERO_3');
		expect(closest?.toGo).toBe(7);
	});

	it('is, on a tie, the first in the order the dashboard shows the series, not the order they came in', () => {
		const closest = closestBadge([series('ANIMAL_WELFARE', 40, 0), series('SOCIO_ECONOMIC', 90, 1)]);

		expect(closest?.level.badge).toBe('SOCIO_ECONOMIC_HERO_2');
		expect(closest?.toGo).toBe(10);
	});

	it('has nothing to go when the count is already past its number, the badge not awarded yet', () => {
		const closest = closestBadge([series('HEALTH', 120, 1), series('ENVIRONMENT', 49, 0)]);

		expect(closest?.level.badge).toBe('HEALTH_HERO_2');
		expect(closest?.toGo).toBe(0);
	});

	it('is none once every badge is held', () => {
		expect(closestBadge([series('ENVIRONMENT', 250, 3), series('HEALTH', 200, 3)])).toBeUndefined();
	});
});
