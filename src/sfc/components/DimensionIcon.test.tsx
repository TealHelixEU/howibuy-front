import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DimensionIcon } from './DimensionIcon';
import type { SustainabilityDimension } from '../sfc';

const ALL: SustainabilityDimension[] = ['ECOLOGICAL', 'SOCIAL', 'ECONOMIC', 'HEALTH', 'ANIMAL_WELFARE'];

function markOf(dimension: SustainabilityDimension): string {
	const { container } = render(<DimensionIcon dimension={dimension} />);
	return container.querySelector('svg')?.innerHTML ?? '';
}

describe('the mark standing for a dimension', () => {
	it('is drawn for every dimension the compass covers', () => {
		expect(ALL.filter((dimension) => markOf(dimension) === '')).toEqual([]);
	});

	it('differs between dimensions, so the categories are told apart by it', () => {
		expect(new Set(ALL.map(markOf)).size).toBe(ALL.length);
	});

	it('is hidden from whoever cannot see it, the category’s name being there to read', () => {
		const { container } = render(<DimensionIcon dimension="HEALTH" />);

		expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
	});
});
