import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Dashboard, DimensionProgress, ScoredSustainabilityDimension } from '@/dashboard/dashboard';
import { MonthlyProgress } from './MonthlyProgress';

vi.mock('@/i18n', () => ({ currentLanguage: () => 'en' }));
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

function progress(
	dimension: ScoredSustainabilityDimension,
	currentAverage: number | null,
	previousAverage: number | null,
	changePercent: number | null,
): DimensionProgress {
	return { dimension, currentAverage, previousAverage, changePercent };
}

/** Both months bought, in the API's order: up, down, flat and up again. */
const BOTH_MONTHS = [
	progress('ENVIRONMENT', 0.87, 0.84, 3.6),
	progress('ANIMAL_WELFARE', 0.8, 0.82, -2.4),
	progress('SOCIO_ECONOMIC', 0.71, 0.71, 0),
	progress('HEALTH', 0.66, 0.6, 10),
];

const NOTHING_THIS_MONTH = [
	progress('ENVIRONMENT', null, 0.84, null),
	progress('ANIMAL_WELFARE', null, 0.82, null),
	progress('SOCIO_ECONOMIC', null, 0.71, null),
	progress('HEALTH', null, 0.6, null),
];

const NOTHING_LAST_MONTH = [
	progress('ENVIRONMENT', 0.87, null, null),
	progress('ANIMAL_WELFARE', 0.8, null, null),
	progress('SOCIO_ECONOMIC', 0.71, null, null),
	progress('HEALTH', 0.66, null, null),
];

const NOTHING_EITHER = [
	progress('ENVIRONMENT', null, null, null),
	progress('ANIMAL_WELFARE', null, null, null),
	progress('SOCIO_ECONOMIC', null, null, null),
	progress('HEALTH', null, null, null),
];

function dashboard(monthlyProgress: DimensionProgress[], purchasedBasketCount = 8): Dashboard {
	return {
		xpTotal: purchasedBasketCount === 0 ? 0 : 1440,
		xpPercentile: purchasedBasketCount === 0 ? null : 70,
		xpPerProduct: 10,
		streak: purchasedBasketCount === 0 ? 0 : 8,
		purchasedBasketCount,
		monthlyProgress,
		badgeSeries: [],
	};
}

function renderMonth(monthlyProgress: DimensionProgress[], purchasedBasketCount?: number, month = '2026-11') {
	return render(<MonthlyProgress dashboard={dashboard(monthlyProgress, purchasedBasketCount)} month={month} />);
}

const NOTES = /^dashboard\.month\.nothing/;

/** The row of a dimension, found by its name. */
function rowOf(nameKey: string): HTMLElement {
	const row = screen.getAllByRole('listitem').find((item) => within(item).queryByText(nameKey) !== null);
	if (row === undefined) {
		throw new Error(`no row for ${nameKey}`);
	}
	return row;
}

/** What the bar draws, as the inline style of each of its parts: the fill's width, then the tick's place. */
function barOf(row: HTMLElement): string[] {
	return Array.from(within(row).getByRole('img').children).map((part) => (part as HTMLElement).style.cssText);
}

describe('this month', () => {
	it('opens with its heading row, says what it shows, and closes with what the bar and the tick are', () => {
		renderMonth(BOTH_MONTHS);

		const block = screen.getByRole('region', { name: 'dashboard.month.title' });
		expect(within(block).queryByText('dashboard.month.note(current=November,previous=October)')).not.toBeNull();
		expect(within(block).queryByText('dashboard.month.text')).not.toBeNull();
		expect(within(block).queryByText('dashboard.month.footnote(current=November,previous=October)')).not.toBeNull();
	});

	it('names the month it was given and the one before it, across the turn of a year', () => {
		renderMonth(BOTH_MONTHS, 8, '2027-01');

		expect(screen.queryByText('dashboard.month.note(current=January,previous=December)')).not.toBeNull();
	});

	it('shows the dimensions in the compass’s order', () => {
		renderMonth(BOTH_MONTHS);

		expect(
			screen.getAllByRole('listitem').map((row) => within(row).getByText(/^dashboard\.dimension\./).textContent),
		).toEqual([
			'dashboard.dimension.environment',
			'dashboard.dimension.socioEconomic',
			'dashboard.dimension.health',
			'dashboard.dimension.animalWelfare',
		]);
	});

	describe('with purchases in both months', () => {
		it('shows each average as a bar with a tick at last month’s, and both averages and the change in figures', () => {
			renderMonth(BOTH_MONTHS);

			expect(screen.queryByText(NOTES)).toBeNull();
			const row = rowOf('dashboard.dimension.environment');
			expect(barOf(row)).toEqual(['width: 87%;', 'left: 84%;']);
			expect(within(row).queryByText('0.87')).not.toBeNull();
			expect(
				within(row).queryByText('dashboard.month.previousAverage(previous=October,average=0.84)'),
			).not.toBeNull();
			expect(within(row).queryByText('+3.6%')).not.toBeNull();
		});

		it('labels the bar with both months’ averages', () => {
			renderMonth(BOTH_MONTHS);

			expect(within(rowOf('dashboard.dimension.environment')).getByRole('img').getAttribute('aria-label')).toBe(
				'dashboard.month.bar(dimension=dashboard.dimension.environment,' +
					'thisMonth=dashboard.month.barThisMonth(current=November,average=0.87),' +
					'lastMonth=dashboard.month.previousAverage(previous=October,average=0.84))',
			);
		});

		it('shows an average to two decimals', () => {
			renderMonth(BOTH_MONTHS);

			expect(within(rowOf('dashboard.dimension.animalWelfare')).queryByText('0.80')).not.toBeNull();
		});

		it('shows a rise on success, with its sign', () => {
			renderMonth(BOTH_MONTHS);

			expect(within(rowOf('dashboard.dimension.health')).getByText('+10.0%').className).toContain('bg-success');
		});

		it('shows a fall on warning, with its sign', () => {
			renderMonth(BOTH_MONTHS);

			expect(within(rowOf('dashboard.dimension.animalWelfare')).getByText('-2.4%').className).toContain(
				'bg-warning',
			);
		});

		it('shows no change on base-200, without a sign', () => {
			renderMonth(BOTH_MONTHS);

			expect(within(rowOf('dashboard.dimension.socioEconomic')).getByText('0.0%').className).toContain(
				'bg-base-200',
			);
		});
	});

	it('keeps last month’s averages on screen while nothing is bought yet this month', () => {
		renderMonth(NOTHING_THIS_MONTH);

		expect(screen.queryByText(NOTES)?.textContent).toBe(
			'dashboard.month.nothingThisMonth(current=November,previous=October)',
		);
		const row = rowOf('dashboard.dimension.environment');
		expect(barOf(row)).toEqual(['left: 84%;']);
		expect(within(row).queryByText('dashboard.month.noAverage')).not.toBeNull();
		expect(
			within(row).queryByText('dashboard.month.previousAverage(previous=October,average=0.84)'),
		).not.toBeNull();
		expect(within(row).queryByText(/%$/)).toBeNull();
		expect(within(row).getByRole('img').getAttribute('aria-label')).toBe(
			'dashboard.month.bar(dimension=dashboard.dimension.environment,' +
				'thisMonth=dashboard.month.barThisMonthNothing(current=November),' +
				'lastMonth=dashboard.month.previousAverage(previous=October,average=0.84))',
		);
	});

	it('shows no change when nothing was bought last month', () => {
		renderMonth(NOTHING_LAST_MONTH);

		expect(screen.queryByText(NOTES)?.textContent).toBe(
			'dashboard.month.nothingLastMonth(current=November,previous=October)',
		);
		const row = rowOf('dashboard.dimension.environment');
		expect(barOf(row)).toEqual(['width: 87%;']);
		expect(within(row).queryByText('0.87')).not.toBeNull();
		expect(within(row).queryByText('dashboard.month.noPurchases(previous=October)')).not.toBeNull();
		expect(within(row).queryByText(/%$/)).toBeNull();
		expect(within(row).getByRole('img').getAttribute('aria-label')).toBe(
			'dashboard.month.bar(dimension=dashboard.dimension.environment,' +
				'thisMonth=dashboard.month.barThisMonth(current=November,average=0.87),' +
				'lastMonth=dashboard.month.barLastMonthNothing(previous=October))',
		);
	});

	it('shows empty rows to a user who has bought before, but in neither month', () => {
		renderMonth(NOTHING_EITHER);

		expect(screen.queryByText(NOTES)?.textContent).toBe(
			'dashboard.month.nothingEither(current=November,previous=October)',
		);
		const row = rowOf('dashboard.dimension.environment');
		expect(barOf(row)).toEqual([]);
		expect(within(row).queryByText('dashboard.month.noAverage')).not.toBeNull();
		expect(within(row).queryByText('dashboard.month.noPurchases(previous=October)')).not.toBeNull();
		expect(within(row).queryByText(/%$/)).toBeNull();
	});

	it('shows one line instead of the rows to a user who has bought nothing yet', () => {
		renderMonth(NOTHING_EITHER, 0);

		expect(screen.queryByText(NOTES)).toBeNull();
		expect(screen.queryAllByRole('listitem')).toHaveLength(0);
		expect(screen.queryByText('dashboard.month.firstPurchase')).not.toBeNull();
		expect(screen.queryByText('dashboard.month.footnote(current=November,previous=October)')).not.toBeNull();
	});
});
