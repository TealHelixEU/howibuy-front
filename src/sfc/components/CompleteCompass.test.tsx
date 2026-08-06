import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Outlet, RouterProvider, createMemoryRouter } from 'react-router';
import { ApiError } from '@/api/client';
import type { Compass } from '@/sfc/compassContext';
import type * as SfcModule from '@/sfc/sfc';
import { completeAttempt, type AttemptStatus, type CompassOverview } from '@/sfc/sfc';
import { CompleteCompass } from './CompleteCompass';

vi.mock('../sfc', async (importOriginal) => ({
	...(await importOriginal<typeof SfcModule>()),
	completeAttempt: vi.fn(),
}));
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

const completeAttemptMock = vi.mocked(completeAttempt);

function overview(answered: number, total: number, attemptStatus: AttemptStatus | null): CompassOverview {
	return {
		overallProgress: { answered, total, percentage: Math.round((100 * answered) / total) },
		overallEstimatedSeconds: total * 20,
		categories: [],
		scaleLabels: {
			NOT_IMPORTANT: 'Not important',
			SLIGHTLY_IMPORTANT: 'Slightly important',
			MODERATELY_IMPORTANT: 'Moderately important',
			VERY_IMPORTANT: 'Very important',
			EXTREMELY_IMPORTANT: 'Extremely important',
		},
		attemptStatus,
		eligibleToStartNewAttempt: false,
		eligibleAt: null,
	};
}

function renderWith(compassOverview: CompassOverview) {
	const refresh = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
	const compass: Compass = { overview: compassOverview, refresh };
	const routes = [
		{
			path: '/sfc',
			element: <Outlet context={compass} />,
			children: [{ index: true, element: <CompleteCompass /> }],
		},
	];
	render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/sfc'] })} />);
	return { refresh };
}

beforeEach(() => {
	vi.resetAllMocks();
	completeAttemptMock.mockResolvedValue(undefined);
});

describe('committing the compass', () => {
	it('is not offered while questions remain unanswered', () => {
		renderWith(overview(42, 43, 'IN_PROGRESS'));

		expect(screen.queryByRole('button', { name: 'sfc.complete.action' })).toBeNull();
	});

	it('is not offered once the attempt is already committed', () => {
		renderWith(overview(43, 43, 'COMPLETED'));

		expect(screen.queryByRole('button', { name: 'sfc.complete.action' })).toBeNull();
	});

	it('is offered once every question is answered, and asks before it locks anything', () => {
		renderWith(overview(43, 43, 'IN_PROGRESS'));

		fireEvent.click(screen.getByRole('button', { name: 'sfc.complete.action' }));

		expect(screen.queryByRole('dialog')).not.toBeNull();
		expect(completeAttemptMock).not.toHaveBeenCalled();
	});

	it('commits the attempt once the user says so, and asks the server where things stand after', async () => {
		const { refresh } = renderWith(overview(43, 43, 'IN_PROGRESS'));
		fireEvent.click(screen.getByRole('button', { name: 'sfc.complete.action' }));

		fireEvent.click(screen.getByRole('button', { name: 'sfc.complete.confirm' }));

		await waitFor(() => {
			expect(completeAttemptMock).toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(refresh).toHaveBeenCalled();
		});
	});

	it('commits nothing when the user thinks better of it', () => {
		renderWith(overview(43, 43, 'IN_PROGRESS'));
		fireEvent.click(screen.getByRole('button', { name: 'sfc.complete.action' }));

		fireEvent.click(screen.getByRole('button', { name: 'sfc.cancel' }));

		expect(screen.queryByRole('dialog')).toBeNull();
		expect(completeAttemptMock).not.toHaveBeenCalled();
	});

	it('sends the user back to the categories when the server finds questions still unanswered', async () => {
		completeAttemptMock.mockRejectedValue(new ApiError(422, 'still unanswered'));
		const { refresh } = renderWith(overview(43, 43, 'IN_PROGRESS'));
		fireEvent.click(screen.getByRole('button', { name: 'sfc.complete.action' }));

		fireEvent.click(screen.getByRole('button', { name: 'sfc.complete.confirm' }));

		await waitFor(() => {
			expect(screen.queryByText('sfc.complete.incomplete')).not.toBeNull();
		});
		expect(refresh).toHaveBeenCalled();
	});

	it('says so when the compass could not be committed at all', async () => {
		completeAttemptMock.mockRejectedValue(new ApiError(503, 'the API is not answering'));
		renderWith(overview(43, 43, 'IN_PROGRESS'));
		fireEvent.click(screen.getByRole('button', { name: 'sfc.complete.action' }));

		fireEvent.click(screen.getByRole('button', { name: 'sfc.complete.confirm' }));

		await waitFor(() => {
			expect(screen.queryByText('sfc.complete.failed')).not.toBeNull();
		});
	});
});
