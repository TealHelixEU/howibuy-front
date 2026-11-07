import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { ApiError } from '@/api/client';
import { fetchOverview } from '@/sfc/sfc';
import type { CompassOverview } from '@/sfc/sfc';
import { DashboardPage } from './DashboardPage';
import { fetchDashboard } from './dashboard';
import type { Dashboard } from './dashboard';
import type * as DashboardModule from './dashboard';

vi.mock('./dashboard', async (importOriginal) => ({
	...(await importOriginal<typeof DashboardModule>()),
	fetchDashboard: vi.fn(),
}));
vi.mock('@/sfc/sfc', () => ({ fetchOverview: vi.fn() }));
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

const fetchDashboardMock = vi.mocked(fetchDashboard);
const fetchOverviewMock = vi.mocked(fetchOverview);

const SHOPPER: Dashboard = {
	xpTotal: 1440,
	xpPercentile: 70,
	xpPerProduct: 10,
	streak: 8,
	purchasedBasketCount: 8,
	monthlyProgress: [],
	badgeSeries: [],
};

const NEWCOMER: Dashboard = { ...SHOPPER, xpTotal: 0, xpPercentile: null, streak: 0, purchasedBasketCount: 0 };

const COMPLETED: CompassOverview = {
	overallProgress: { answered: 43, total: 43, percentage: 100 },
	overallEstimatedSeconds: 860,
	categories: [],
	scaleLabels: {
		NOT_IMPORTANT: 'Not important',
		SLIGHTLY_IMPORTANT: 'Slightly important',
		MODERATELY_IMPORTANT: 'Moderately important',
		VERY_IMPORTANT: 'Very important',
		EXTREMELY_IMPORTANT: 'Extremely important',
	},
	attemptStatus: 'COMPLETED',
	hasCompletedAttempt: true,
	eligibleToStartNewAttempt: false,
	eligibleAt: '2026-12-01T10:00:00',
};

const NOT_STARTED: CompassOverview = {
	...COMPLETED,
	overallProgress: { answered: 0, total: 43, percentage: 0 },
	attemptStatus: null,
	hasCompletedAttempt: false,
	eligibleAt: null,
};

function renderDashboard() {
	return render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <DashboardPage /> }])} />);
}

const TOTALS = { name: 'dashboard.totals' };
const THIS_MONTH = { name: 'dashboard.month.title' };
const BADGES = { name: 'dashboard.badges.title' };

beforeEach(() => {
	fetchDashboardMock.mockReset();
	fetchOverviewMock.mockReset();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('the dashboard page', () => {
	it('asks for the month of the browser’s own date, and names that month and the one before it', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date(2026, 10, 7, 12));
		fetchDashboardMock.mockResolvedValue(SHOPPER);
		fetchOverviewMock.mockResolvedValue(COMPLETED);

		renderDashboard();

		const month = await screen.findByRole('region', THIS_MONTH);
		expect(fetchDashboardMock).toHaveBeenCalledWith('2026-11');
		expect(within(month).queryByText('dashboard.month.note(current=November,previous=October)')).not.toBeNull();
	});

	it('shows a spinner, and nothing of the dashboard, while either read is in flight', () => {
		fetchDashboardMock.mockResolvedValue(SHOPPER);
		fetchOverviewMock.mockReturnValue(new Promise(() => {}));

		renderDashboard();

		expect(screen.queryByLabelText('dashboard.loading')).not.toBeNull();
		expect(screen.queryByRole('region', TOTALS)).toBeNull();
	});

	it('shows the invitation to the compass, then the totals of a user who has bought, then this month, then the badges', async () => {
		fetchDashboardMock.mockResolvedValue(SHOPPER);
		fetchOverviewMock.mockResolvedValue(NOT_STARTED);

		renderDashboard();

		const totals = await screen.findByRole('region', TOTALS);
		const invitation = screen.getByRole('region', { name: 'dashboard.invitation.start.title' });
		const month = screen.getByRole('region', THIS_MONTH);
		const badges = screen.getByRole('region', BADGES);
		expect(invitation.compareDocumentPosition(totals) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(totals.compareDocumentPosition(month) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(month.compareDocumentPosition(badges) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(screen.queryByText('dashboard.empty.title')).toBeNull();
	});

	it('shows what the first purchase starts, instead of the totals, to a user who has bought nothing', async () => {
		fetchDashboardMock.mockResolvedValue(NEWCOMER);
		fetchOverviewMock.mockResolvedValue(COMPLETED);

		renderDashboard();

		expect(await screen.findByRole('heading', { name: 'dashboard.empty.title' })).not.toBeNull();
		expect(screen.queryByRole('region', TOTALS)).toBeNull();
		expect(screen.queryByRole('region', THIS_MONTH)).not.toBeNull();
		expect(screen.queryByRole('region', BADGES)).not.toBeNull();
	});

	it('offers another go when the dashboard cannot be read, and shows it once it can', async () => {
		fetchDashboardMock
			.mockRejectedValueOnce(new ApiError(503, 'the API is not answering'))
			.mockResolvedValueOnce(SHOPPER);
		fetchOverviewMock.mockResolvedValue(COMPLETED);

		renderDashboard();
		await waitFor(() => {
			expect(screen.queryByText('dashboard.loadFailed')).not.toBeNull();
		});
		expect(screen.queryByRole('region', TOTALS)).toBeNull();

		fireEvent.click(screen.getByRole('button', { name: 'common.retry' }));

		expect(await screen.findByRole('region', TOTALS)).not.toBeNull();
		expect(screen.queryByText('dashboard.loadFailed')).toBeNull();
	});

	it('asks for the same month on a retry, though the month has turned since', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date(2026, 9, 31, 23, 59));
		fetchDashboardMock
			.mockRejectedValueOnce(new ApiError(503, 'the API is not answering'))
			.mockResolvedValueOnce(SHOPPER);
		fetchOverviewMock.mockResolvedValue(COMPLETED);

		renderDashboard();
		const retry = await screen.findByRole('button', { name: 'common.retry' });
		vi.setSystemTime(new Date(2026, 10, 1, 0, 1));
		fireEvent.click(retry);

		const month = await screen.findByRole('region', THIS_MONTH);
		expect(fetchDashboardMock.mock.calls).toEqual([['2026-10'], ['2026-10']]);
		expect(within(month).queryByText('dashboard.month.note(current=October,previous=September)')).not.toBeNull();
	});

	it('fails as one when the compass overview cannot be read, and retries both', async () => {
		fetchDashboardMock.mockResolvedValue(SHOPPER);
		fetchOverviewMock
			.mockRejectedValueOnce(new ApiError(503, 'the API is not answering'))
			.mockResolvedValueOnce(COMPLETED);

		renderDashboard();
		await waitFor(() => {
			expect(screen.getAllByText('dashboard.loadFailed')).toHaveLength(1);
		});
		expect(screen.queryByRole('region', TOTALS)).toBeNull();

		fireEvent.click(screen.getByRole('button', { name: 'common.retry' }));

		expect(await screen.findByRole('region', TOTALS)).not.toBeNull();
		expect(fetchDashboardMock).toHaveBeenCalledTimes(2);
	});
});
