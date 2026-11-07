import { describe, expect, it } from 'vitest';
import en from '@/i18n/en.json';
import type { ScoredSustainabilityDimension } from './dashboard';
import { dimensionNameKey, inCompassOrder } from './dimensions';

const ALL: ScoredSustainabilityDimension[] = ['ENVIRONMENT', 'ANIMAL_WELFARE', 'SOCIO_ECONOMIC', 'HEALTH'];

interface Named {
	dimension: ScoredSustainabilityDimension;
	name: string;
}

function named(dimension: ScoredSustainabilityDimension, name: string = dimension): Named {
	return { dimension, name };
}

/** What a key reads in the app's English, or undefined when there is no such key. */
function english(key: string): unknown {
	return key.split('.').reduce<unknown>((at, part) => (at as Record<string, unknown> | undefined)?.[part], en);
}

describe('the order the dashboard shows the dimensions in', () => {
	it('is the compass’s, not the order the API sends them in', () => {
		const asTheApiSendsThem = ALL.map((dimension) => named(dimension));

		const ordered = inCompassOrder(asTheApiSendsThem, (item) => item.dimension);

		expect(ordered.map((item) => item.dimension)).toEqual([
			'ENVIRONMENT',
			'SOCIO_ECONOMIC',
			'HEALTH',
			'ANIMAL_WELFARE',
		]);
	});

	it('puts a dimension it does not know last rather than first', () => {
		const withNewcomer = [named('CULTURAL' as ScoredSustainabilityDimension), named('HEALTH')];

		const ordered = inCompassOrder(withNewcomer, (item) => item.dimension);

		expect(ordered.map((item) => item.dimension)).toEqual(['HEALTH', 'CULTURAL']);
	});
});

describe('the name of a dimension', () => {
	it('is in the app’s own words for every dimension, and differs between them', () => {
		const names = ALL.map((dimension) => english(dimensionNameKey(dimension)));

		expect(names.every((name) => typeof name === 'string')).toBe(true);
		expect(new Set(names).size).toBe(ALL.length);
	});
});
