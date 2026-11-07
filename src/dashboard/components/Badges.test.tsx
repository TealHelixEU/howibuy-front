import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { BadgeSeries, ScoredSustainabilityDimension } from '@/dashboard/dashboard';
import { Badges } from './Badges';

vi.mock('react-i18next', () => {
	const t = (key: string, values?: Record<string, unknown>) =>
		values === undefined
			? key
			: `${key}(${Object.entries(values)
					.map(([name, value]) => `${name}=${String(value)}`)
					.join(',')})`;
	return {
		useTranslation: () => ({ t }),
		Trans: ({ i18nKey, values }: { i18nKey: string; values?: Record<string, unknown> }) => t(i18nKey, values),
	};
});

const CODES: Record<ScoredSustainabilityDimension, string> = {
	ENVIRONMENT: 'ENVIRONMENTAL_HERO',
	ANIMAL_WELFARE: 'ANIMAL_WELFARE_HERO',
	SOCIO_ECONOMIC: 'SOCIO_ECONOMIC_HERO',
	HEALTH: 'HEALTH_HERO',
};

const NAMES: Record<ScoredSustainabilityDimension, string> = {
	ENVIRONMENT: 'Environmental Hero',
	ANIMAL_WELFARE: 'Animal Welfare Hero',
	SOCIO_ECONOMIC: 'Socio-economic Hero',
	HEALTH: 'Health Hero',
};

/** A series with the first {@link held} of its levels earned, at the badge numbers of today unless given others. */
function series(
	dimension: ScoredSustainabilityDimension,
	productCount: number,
	held: number,
	numbers: number[] = [50, 100, 200],
): BadgeSeries {
	return {
		dimension,
		productCount,
		levels: numbers.map((requiredProducts, index) => ({
			badge: `${CODES[dimension]}_${index + 1}` as BadgeSeries['levels'][number]['badge'],
			label: `${NAMES[dimension]} Level ${index + 1}`,
			requiredProducts,
			earned: index < held,
		})),
	};
}

/** Seven of twelve held, in the API's order. */
const SHOPPER = [
	series('ENVIRONMENT', 193, 2),
	series('ANIMAL_WELFARE', 163, 2),
	series('SOCIO_ECONOMIC', 182, 2),
	series('HEALTH', 57, 1),
];

const NEWCOMER = [
	series('ENVIRONMENT', 0, 0),
	series('ANIMAL_WELFARE', 0, 0),
	series('SOCIO_ECONOMIC', 0, 0),
	series('HEALTH', 0, 0),
];

function cardOf(nameKey: string): HTMLElement {
	return screen.getByRole('group', { name: nameKey });
}

/** Each level of a card, as its medallion's name, its number and its caption. */
function levelsOf(card: HTMLElement): string[][] {
	return within(card)
		.getAllByRole('listitem')
		.map((level) => [
			within(level).getByRole('img').getAttribute('aria-label') ?? '',
			...Array.from(level.querySelectorAll('span'), (line) => line.textContent ?? ''),
		]);
}

describe('the badges', () => {
	it('open with their heading row, which counts the badges earned, and say what a badge counts', () => {
		render(<Badges series={SHOPPER} />);

		const block = screen.getByRole('region', { name: 'dashboard.badges.title' });
		expect(within(block).queryByText('dashboard.badges.earned(earned=7,total=12)')).not.toBeNull();
		expect(within(block).queryByText('dashboard.badges.text')).not.toBeNull();
	});

	it('show a card per series, in the compass’s order', () => {
		render(<Badges series={SHOPPER} />);

		expect(
			screen.getAllByRole('group').map((card) => within(card).getByRole('heading', { level: 3 }).textContent),
		).toEqual([
			'dashboard.dimension.environment',
			'dashboard.dimension.socioEconomic',
			'dashboard.dimension.health',
			'dashboard.dimension.animalWelfare',
		]);
	});

	describe('a card', () => {
		it('is titled by its dimension, with how many of its badges are earned', () => {
			render(<Badges series={SHOPPER} />);

			const card = cardOf('dashboard.dimension.environment');
			expect(within(card).queryByText('dashboard.badges.earned(earned=2,total=3)')).not.toBeNull();
		});

		it('shows the three levels, each with its medallion, its number, and Earned or what it takes', () => {
			render(<Badges series={SHOPPER} />);

			expect(levelsOf(cardOf('dashboard.dimension.environment'))).toEqual([
				[
					'dashboard.badges.medallionEarned(label=Environmental Hero Level 1)',
					'dashboard.badges.level(level=1)',
					'dashboard.badges.levelEarned',
				],
				[
					'dashboard.badges.medallionEarned(label=Environmental Hero Level 2)',
					'dashboard.badges.level(level=2)',
					'dashboard.badges.levelEarned',
				],
				[
					'dashboard.badges.medallionNotEarned(label=Environmental Hero Level 3)',
					'dashboard.badges.level(level=3)',
					'dashboard.badges.requiredProducts(count=200)',
				],
			]);
		});

		it('draws each level’s medallion with as many arcs as its number', () => {
			render(<Badges series={SHOPPER} />);

			expect(
				within(cardOf('dashboard.dimension.health'))
					.getAllByRole('img')
					.map(
						(medallion) =>
							Array.from(medallion.children).filter(
								(part) => part.getAttribute('class') === 'stroke-base-300',
							).length,
					),
			).toEqual([2, 1, 0]);
		});

		it('shows the next level, with its label, a bar of how far the count has come, and the products to go', () => {
			render(<Badges series={SHOPPER} />);

			const card = cardOf('dashboard.dimension.environment');
			expect(within(card).queryByText('dashboard.badges.next(label=Environmental Hero Level 3)')).not.toBeNull();
			expect(
				within(card).getByRole('progressbar', { name: 'Environmental Hero Level 3' }).getAttribute('value'),
			).toBe('96.5');
			expect(
				within(card).queryByText('dashboard.badges.productCount(productCount=193,count=200)'),
			).not.toBeNull();
			expect(within(card).queryByText('dashboard.badges.toGo(count=7)')).not.toBeNull();
		});

		it('says all three are earned instead of showing a next level, once the three are held', () => {
			render(<Badges series={[series('HEALTH', 250, 3)]} />);

			const card = cardOf('dashboard.dimension.health');
			expect(within(card).queryByText('dashboard.badges.allEarned')).not.toBeNull();
			expect(within(card).queryByRole('progressbar')).toBeNull();
			expect(within(card).queryByText(/^dashboard\.badges\.(next|toGo)/)).toBeNull();
		});

		it('shows a full bar and nothing to go for a count already past the next level’s number', () => {
			render(<Badges series={[series('HEALTH', 120, 1)]} />);

			const card = cardOf('dashboard.dimension.health');
			expect(within(card).queryByText('dashboard.badges.next(label=Health Hero Level 2)')).not.toBeNull();
			expect(within(card).getByRole('progressbar').getAttribute('value')).toBe('100');
			expect(within(card).queryByText('dashboard.badges.toGo(count=0)')).not.toBeNull();
		});
	});

	describe('take whether a badge is earned from the API, not from the count', () => {
		it('keeping a held badge earned whose number has since been raised above the count', () => {
			render(<Badges series={[series('HEALTH', 120, 2, [50, 150, 200])]} />);

			const card = cardOf('dashboard.dimension.health');
			expect(levelsOf(card)[1]).toEqual([
				'dashboard.badges.medallionEarned(label=Health Hero Level 2)',
				'dashboard.badges.level(level=2)',
				'dashboard.badges.levelEarned',
			]);
			expect(within(card).queryByText('dashboard.badges.next(label=Health Hero Level 3)')).not.toBeNull();
			expect(within(card).queryByText('dashboard.badges.toGo(count=80)')).not.toBeNull();
		});

		it('leaving a badge not earned whose lowered number the count already reaches', () => {
			render(<Badges series={[series('HEALTH', 120, 1)]} />);

			expect(levelsOf(cardOf('dashboard.dimension.health'))[1]).toEqual([
				'dashboard.badges.medallionNotEarned(label=Health Hero Level 2)',
				'dashboard.badges.level(level=2)',
				'dashboard.badges.requiredProducts(count=100)',
			]);
		});
	});

	it('show every badge not earned, each with what it takes, to a user who has bought nothing', () => {
		render(<Badges series={NEWCOMER} />);

		expect(screen.queryByText('dashboard.badges.earned(earned=0,total=12)')).not.toBeNull();
		const medallions = screen.getAllByRole('img').map((medallion) => medallion.getAttribute('aria-label'));
		expect(medallions).toHaveLength(12);
		expect(medallions.filter((name) => name?.startsWith('dashboard.badges.medallionNotEarned'))).toHaveLength(12);
		expect(screen.getAllByText('dashboard.badges.requiredProducts(count=50)')).toHaveLength(4);
		expect(screen.getAllByText('dashboard.badges.requiredProducts(count=100)')).toHaveLength(4);
		expect(screen.getAllByText('dashboard.badges.requiredProducts(count=200)')).toHaveLength(4);
		expect(screen.getAllByText('dashboard.badges.toGo(count=50)')).toHaveLength(4);
	});
});
