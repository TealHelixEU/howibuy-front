import { describe, expect, it } from 'vitest';
import { inPresentationOrder } from './dimensions';
import type { SustainabilityDimension } from './sfc';

const ALL: SustainabilityDimension[] = ['ECOLOGICAL', 'SOCIAL', 'ECONOMIC', 'HEALTH', 'ANIMAL_WELFARE'];

interface Named {
	dimension: SustainabilityDimension;
	name: string;
}

function named(dimension: SustainabilityDimension, name: string = dimension): Named {
	return { dimension, name };
}

describe('the order the compass presents its categories in', () => {
	it('follows the dimensions, not the order the API happened to send', () => {
		// The API orders by the dimension's stored name, which is this.
		const asTheApiSendsThem = [
			named('ANIMAL_WELFARE'),
			named('ECOLOGICAL'),
			named('ECONOMIC'),
			named('HEALTH'),
			named('SOCIAL'),
		];

		const ordered = inPresentationOrder(asTheApiSendsThem, (item) => item.dimension);

		expect(ordered.map((item) => item.dimension)).toEqual(ALL);
	});

	it('keeps the API’s order among categories sharing a dimension', () => {
		const two = [named('HEALTH', 'second'), named('ECOLOGICAL', 'first'), named('HEALTH', 'third')];

		const ordered = inPresentationOrder(two, (item) => item.dimension);

		expect(ordered.map((item) => item.name)).toEqual(['first', 'second', 'third']);
	});

	it('puts a dimension it does not know last rather than first', () => {
		const withNewcomer = [named('CULTURAL' as SustainabilityDimension), named('HEALTH')];

		const ordered = inPresentationOrder(withNewcomer, (item) => item.dimension);

		expect(ordered.map((item) => item.dimension)).toEqual(['HEALTH', 'CULTURAL']);
	});
});
