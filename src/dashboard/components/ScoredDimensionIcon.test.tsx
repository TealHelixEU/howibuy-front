import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ScoredSustainabilityDimension } from '@/dashboard/dashboard';
import { ScoredDimensionIcon } from './ScoredDimensionIcon';

const ALL: ScoredSustainabilityDimension[] = ['ENVIRONMENT', 'ANIMAL_WELFARE', 'SOCIO_ECONOMIC', 'HEALTH'];

function markOf(dimension: ScoredSustainabilityDimension): string {
	const { container } = render(<ScoredDimensionIcon dimension={dimension} />);
	return container.querySelector('svg')?.innerHTML ?? '';
}

describe('the mark standing for a scored dimension', () => {
	it('is drawn for every dimension a product is scored on', () => {
		expect(ALL.filter((dimension) => markOf(dimension) === '')).toEqual([]);
	});

	it('differs between dimensions', () => {
		expect(new Set(ALL.map(markOf)).size).toBe(ALL.length);
	});

	it('is hidden from whoever cannot see it, the dimension’s name being there to read', () => {
		const { container } = render(<ScoredDimensionIcon dimension="HEALTH" />);

		expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
	});
});
