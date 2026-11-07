import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { ApiError } from '@/api/client';
import { fetchOverview } from '@/sfc/sfc';
import type { CompassOverview } from '@/sfc/sfc';
import { DashboardPage } from './DashboardPage';
import { currentMonth, fetchDashboard } from './dashboard';
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

beforeEach(() => {
	fetchDashboardMock.mockReset();
	fetchOverviewMock.mockReset();
});

describe('the dashboard page', () => {
	it('asks for the month of the browser’s own date', async () => {
		fetchDashboardMock.mockResolvedValue(SHOPPER);
		fetchOverviewMock.mockResolvedValue(COMPLETED);

		renderDashboard();

		await screen.findByRole('region', TOTALS);
		expect(fetchDashboardMock).toHaveBeenCalledWith(currentMonth(new Date()));
	});

	it('shows a spinner, and nothing of the dashboard, while either read is in flight', () => {
		fetchDashboardMock.mockResolvedValue(SHOPPER);
		fetchOverviewMock.mockReturnValue(new Promise(() => {}));

		renderDashboard();

		expect(screen.queryByLabelText('dashboard.loading')).not.toBeNull();
		expect(screen.queryByRole('region', TOTALS)).toBeNull();
	});

	it('shows the invitation to the compass, then the totals of a user who has bought', async () => {
		fetchDashboardMock.mockResolvedValue(SHOPPER);
		fetchOverviewMock.mockResolvedValue(NOT_STARTED);

		renderDashboard();

		const totals = await screen.findByRole('region', TOTALS);
		const invitation = screen.getByRole('region', { name: 'dashboard.invitation.start.title' });
		expect(invitation.compareDocumentPosition(totals) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(screen.queryByText('dashboard.empty.title')).toBeNull();
	});

	it('shows what the first purchase starts, instead of the totals, to a user who has bought nothing', async () => {
		fetchDashboardMock.mockResolvedValue(NEWCOMER);
		fetchOverviewMock.mockResolvedValue(COMPLETED);

		renderDashboard();

		expect(await screen.findByRole('heading', { name: 'dashboard.empty.title' })).not.toBeNull();
		expect(screen.queryByRole('region', TOTALS)).toBeNull();
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
