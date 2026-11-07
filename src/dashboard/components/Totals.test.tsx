import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { BadgeSeries, Dashboard, ScoredSustainabilityDimension } from '@/dashboard/dashboard';
import { PERCENTILE_SHOWN_FROM } from '@/dashboard/percentile';
import { EmptyTotals, Totals } from './Totals';

vi.mock('@/i18n', () => ({ currentLanguage: () => 'en' }));
vi.mock('react-i18next', () => {
	const t = (key: string, values?: Record<string, unknown>) =>
		values === undefined
			? key
			: `${key}(${Object.entries(values)
					.map(([name, value]) => `${name}=${String(value)}`)
					.join(',')})`;
	return {
		useTranslation: () => ({ t }),
		Trans: ({ i18nKey, values, count }: { i18nKey: string; values?: Record<string, unknown>; count?: number }) =>
			t(i18nKey, { ...values, count }),
	};
});

const CODES: Record<ScoredSustainabilityDimension, string> = {
	ENVIRONMENT: 'ENVIRONMENTAL_HERO',
	ANIMAL_WELFARE: 'ANIMAL_WELFARE_HERO',
	SOCIO_ECONOMIC: 'SOCIO_ECONOMIC_HERO',
	HEALTH: 'HEALTH_HERO',
};

/** A series with the first {@link held} of its levels earned. */
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
			label: `${CODES[dimension]} level ${index + 1}`,
			requiredProducts,
			earned: index < held,
		})),
	};
}

/** Eight weeks in: seven badges of twelve, the closest being Environment's third, 7 products away. */
const SHOPPER: Dashboard = {
	xpTotal: 1440,
	xpPercentile: 70,
	xpPerProduct: 10,
	streak: 8,
	purchasedBasketCount: 8,
	monthlyProgress: [],
	badgeSeries: [
		series('ENVIRONMENT', 193, 2),
		series('ANIMAL_WELFARE', 163, 2),
		series('SOCIO_ECONOMIC', 182, 2),
		series('HEALTH', 57, 1),
	],
};

const NEWCOMER: Dashboard = {
	xpTotal: 0,
	xpPercentile: null,
	xpPerProduct: 10,
	streak: 0,
	purchasedBasketCount: 0,
	monthlyProgress: [],
	badgeSeries: (['ENVIRONMENT', 'ANIMAL_WELFARE', 'SOCIO_ECONOMIC', 'HEALTH'] as const).map((dimension) =>
		series(dimension, 0, 0),
	),
};

const AHEAD = /^dashboard\.xp\.ahead/;
const COMPARED = 'dashboard.xp.compared';

describe('the totals', () => {
	it('show the XP total, the streak and the badges held of all of them', () => {
		render(<Totals dashboard={SHOPPER} />);

		expect(screen.queryByText('1,440')).not.toBeNull();
		expect(screen.queryByText('dashboard.streak.unit(count=8)')).not.toBeNull();
		expect(screen.queryByText('7')).not.toBeNull();
		expect(screen.queryByText('dashboard.badges.ofAll(total=12)')).not.toBeNull();
	});

	it('name the badge closest to being earned, and the products it takes', () => {
		render(<Totals dashboard={SHOPPER} />);

		expect(screen.queryByText('dashboard.badges.closest(label=ENVIRONMENTAL_HERO level 3,count=7)')).not.toBeNull();
	});

	it('name no closest badge once every badge is held', () => {
		render(
			<Totals
				dashboard={{ ...SHOPPER, badgeSeries: SHOPPER.badgeSeries.map((one) => series(one.dimension, 250, 3)) }}
			/>,
		);

		expect(screen.queryByText(/^dashboard\.badges\.closest/)).toBeNull();
	});

	it('quote the API’s XP of a product when explaining XP', () => {
		render(<Totals dashboard={{ ...SHOPPER, xpPerProduct: 15 }} />);

		expect(screen.queryByText('dashboard.xp.earning(xp=15)')).not.toBeNull();
	});

	it('keep one explanation open at a time', () => {
		render(<Totals dashboard={SHOPPER} />);
		const xp = screen.getByRole('button', { name: 'dashboard.xp.explain' });
		const streak = screen.getByRole('button', { name: 'dashboard.streak.explain' });

		fireEvent.click(xp);
		fireEvent.click(streak);

		expect(xp.getAttribute('aria-expanded')).toBe('false');
		expect(streak.getAttribute('aria-expanded')).toBe('true');
	});

	describe('compare the user with other shoppers', () => {
		it(`from ${PERCENTILE_SHOWN_FROM}% up, in the tile and in the explanation`, () => {
			render(<Totals dashboard={{ ...SHOPPER, xpPercentile: PERCENTILE_SHOWN_FROM }} />);

			expect(screen.queryByText(`dashboard.xp.ahead(share=${PERCENTILE_SHOWN_FROM / 100})`)).not.toBeNull();
			expect(screen.queryByText(COMPARED)).not.toBeNull();
		});

		it('not at all one below that', () => {
			render(<Totals dashboard={{ ...SHOPPER, xpPercentile: PERCENTILE_SHOWN_FROM - 1 }} />);

			expect(screen.queryByText(AHEAD)).toBeNull();
			expect(screen.queryByText(COMPARED)).toBeNull();
			expect(screen.queryByText('1,440')).not.toBeNull();
		});

		it('not at all without anyone to compare with', () => {
			render(<Totals dashboard={{ ...SHOPPER, xpPercentile: null }} />);

			expect(screen.queryByText(AHEAD)).toBeNull();
			expect(screen.queryByText(COMPARED)).toBeNull();
		});
	});
});

describe('the totals of a user who has bought nothing yet', () => {
	it('say what the first purchase starts', () => {
		render(<EmptyTotals dashboard={NEWCOMER} />);

		expect(screen.queryByRole('heading', { name: 'dashboard.empty.title' })).not.toBeNull();
		expect(screen.queryByText('dashboard.empty.text')).not.toBeNull();
	});

	it('show each counter at zero with the rule that earns it, in the API’s numbers', () => {
		render(
			<EmptyTotals
				dashboard={{
					...NEWCOMER,
					xpPerProduct: 15,
					badgeSeries: NEWCOMER.badgeSeries.map((one) => series(one.dimension, 0, 0, [40, 80, 160])),
				}}
			/>,
		);

		expect(screen.getAllByText('0')).toHaveLength(3);
		expect(screen.queryByText('dashboard.xp.rule(xp=15)')).not.toBeNull();
		expect(screen.queryByText('dashboard.streak.rule')).not.toBeNull();
		expect(screen.queryByText('dashboard.badges.rule(first=40,second=80,third=160)')).not.toBeNull();
	});
});
