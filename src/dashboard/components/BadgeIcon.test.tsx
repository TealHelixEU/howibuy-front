import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BadgeIcon } from './BadgeIcon';
import { ScoredDimensionIcon } from './ScoredDimensionIcon';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, values?: Record<string, unknown>) =>
			values === undefined
				? key
				: `${key}(${Object.entries(values)
						.map(([name, value]) => `${name}=${String(value)}`)
						.join(',')})`,
	}),
}));

function renderMedallion(level: number, earned: boolean) {
	return render(<BadgeIcon dimension="HEALTH" level={level} label="Health Hero" earned={earned} />);
}

function medallion(): SVGSVGElement {
	return screen.getByRole('img') as unknown as SVGSVGElement;
}

/** The colour of each of the three arcs around the disc, from the first to the third. */
function arcs(): (string | null)[] {
	return Array.from(medallion().children)
		.filter((part) => part.tagName === 'path')
		.map((arc) => arc.getAttribute('class'));
}

function disc(): string | null {
	return medallion().querySelector('circle')?.getAttribute('class') ?? null;
}

/** The dimension's mark on the disc. */
function mark(): SVGSVGElement {
	const found = medallion().querySelector('svg');
	if (found === null) {
		throw new Error('no mark on the medallion');
	}
	return found;
}

describe('the medallion of a badge', () => {
	describe('earned', () => {
		it('colours one arc in primary at the first level, and leaves the other two on base-300', () => {
			renderMedallion(1, true);

			expect(arcs()).toEqual(['stroke-primary', 'stroke-base-300', 'stroke-base-300']);
		});

		it('colours two arcs at the second level', () => {
			renderMedallion(2, true);

			expect(arcs()).toEqual(['stroke-primary', 'stroke-primary', 'stroke-base-300']);
		});

		it('colours all three at the third', () => {
			renderMedallion(3, true);

			expect(arcs()).toEqual(['stroke-primary', 'stroke-primary', 'stroke-primary']);
		});

		it('shows the mark in white on a blue disc', () => {
			renderMedallion(2, true);

			expect(disc()).toBe('fill-brand-blue stroke-brand-blue');
			expect(mark().getAttribute('class')).toBe('text-white');
		});
	});

	describe('not earned yet', () => {
		it('colours one arc in grey at the first level, and leaves the other two on base-300', () => {
			renderMedallion(1, false);

			expect(arcs()).toEqual(['stroke-[#a3a3a3]', 'stroke-base-300', 'stroke-base-300']);
		});

		it('colours two arcs at the second level', () => {
			renderMedallion(2, false);

			expect(arcs()).toEqual(['stroke-[#a3a3a3]', 'stroke-[#a3a3a3]', 'stroke-base-300']);
		});

		it('colours all three at the third', () => {
			renderMedallion(3, false);

			expect(arcs()).toEqual(['stroke-[#a3a3a3]', 'stroke-[#a3a3a3]', 'stroke-[#a3a3a3]']);
		});

		it('shows the mark in grey on a pale disc with a grey border', () => {
			renderMedallion(2, false);

			expect(disc()).toBe('fill-base-200 stroke-[#d0d0d0]');
			expect(mark().getAttribute('class')).toBe('text-[#767676]');
		});
	});

	it('shows the mark of the badge’s dimension, centred on the disc', () => {
		renderMedallion(1, true);
		const { container } = render(<ScoredDimensionIcon dimension="HEALTH" />);

		expect(mark().innerHTML).toBe(container.querySelector('svg')?.innerHTML);
		expect(['x', 'y', 'width', 'height'].map((name) => mark().getAttribute(name))).toEqual([
			'15',
			'15',
			'18',
			'18',
		]);
	});

	it('is named by the badge’s label, and whether it is earned', () => {
		renderMedallion(2, true);

		expect(medallion().getAttribute('aria-label')).toBe('dashboard.badges.medallionEarned(label=Health Hero)');
	});

	it('is named by the badge’s label, and that it is not earned yet', () => {
		renderMedallion(2, false);

		expect(medallion().getAttribute('aria-label')).toBe('dashboard.badges.medallionNotEarned(label=Health Hero)');
	});
});
