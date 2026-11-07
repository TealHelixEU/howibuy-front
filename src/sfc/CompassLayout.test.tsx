import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { ApiError } from '@/api/client';
import { CompassLayout } from './CompassLayout';
import { useCompass } from './compassContext';
import { fetchOverview } from './sfc';
import type { CompassOverview } from './sfc';

vi.mock('./sfc');
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

const fetchOverviewMock = vi.mocked(fetchOverview);

const OVERVIEW: CompassOverview = {
	overallProgress: { answered: 12, total: 43, percentage: 28 },
	overallEstimatedSeconds: 860,
	categories: [],
	scaleLabels: {
		NOT_IMPORTANT: 'Not important',
		SLIGHTLY_IMPORTANT: 'Slightly important',
		MODERATELY_IMPORTANT: 'Moderately important',
		VERY_IMPORTANT: 'Very important',
		EXTREMELY_IMPORTANT: 'Extremely important',
	},
	attemptStatus: 'IN_PROGRESS',
	hasCompletedAttempt: false,
	eligibleToStartNewAttempt: false,
	eligibleAt: null,
};

/** Stands in for whichever compass screen the layout is wrapping, showing what it was handed. */
function Screen() {
	const { overview } = useCompass();
	return <p>screen sees {overview.overallProgress.answered} answered</p>;
}

function renderLayout() {
	const routes = [
		{
			path: '/sfc',
			element: <CompassLayout />,
			children: [{ index: true, element: <Screen /> }],
		},
	];
	return render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/sfc'] })} />);
}

describe('the compass screens’ shared state', () => {
	it('says it is working while the overview is on its way', () => {
		fetchOverviewMock.mockReturnValue(new Promise(() => {}));

		renderLayout();

		expect(screen.queryByLabelText('sfc.loading')).not.toBeNull();
		expect(screen.queryByText(/screen sees/)).toBeNull();
	});

	it('hands the overview to the screen it wraps', async () => {
		fetchOverviewMock.mockResolvedValue(OVERVIEW);

		renderLayout();

		await waitFor(() => {
			expect(screen.queryByText('screen sees 12 answered')).not.toBeNull();
		});
	});

	it('offers to take the compass again alongside whatever screen is showing', async () => {
		fetchOverviewMock.mockResolvedValue({
			...OVERVIEW,
			attemptStatus: 'COMPLETED',
			hasCompletedAttempt: true,
			eligibleToStartNewAttempt: true,
			eligibleAt: '2026-09-05T14:03:00',
		});

		renderLayout();

		await waitFor(() => {
			expect(screen.queryByRole('button', { name: 'sfc.again.action' })).not.toBeNull();
		});
		expect(screen.queryByText('screen sees 12 answered')).not.toBeNull();
	});

	it('offers another go when the overview cannot be had, and shows the screen once it can', async () => {
		fetchOverviewMock
			.mockRejectedValueOnce(new ApiError(503, 'the API is not answering'))
			.mockResolvedValueOnce(OVERVIEW);

		renderLayout();
		await waitFor(() => {
			expect(screen.queryByText('sfc.loadFailed')).not.toBeNull();
		});
		expect(screen.queryByText(/screen sees/)).toBeNull();

		fireEvent.click(screen.getByRole('button', { name: 'common.retry' }));

		await waitFor(() => {
			expect(screen.queryByText('screen sees 12 answered')).not.toBeNull();
		});
		expect(screen.queryByText('sfc.loadFailed')).toBeNull();
	});
});
