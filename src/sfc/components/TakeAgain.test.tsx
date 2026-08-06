import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import type * as SfcModule from '@/sfc/sfc';
import { startNewAttempt, type AttemptStatus, type CompassOverview } from '@/sfc/sfc';
import { TakeAgain } from './TakeAgain';

vi.mock('../sfc', async (importOriginal) => ({
	...(await importOriginal<typeof SfcModule>()),
	startNewAttempt: vi.fn(),
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

const startNewAttemptMock = vi.mocked(startNewAttempt);

function overview(
	attemptStatus: AttemptStatus | null,
	eligibleToStartNewAttempt: boolean,
	eligibleAt: string | null,
): CompassOverview {
	return {
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
		attemptStatus,
		eligibleToStartNewAttempt,
		eligibleAt,
	};
}

function renderWith(compassOverview: CompassOverview) {
	const onStarted = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
	render(<TakeAgain overview={compassOverview} onStarted={onStarted} />);
	return { onStarted };
}

beforeEach(() => {
	vi.resetAllMocks();
	startNewAttemptMock.mockResolvedValue(undefined);
});

describe('taking the compass again', () => {
	it('is not spoken of while an attempt is under way', () => {
		renderWith(overview('IN_PROGRESS', false, null));

		expect(screen.queryByRole('button', { name: 'sfc.again.action' })).toBeNull();
		expect(screen.queryByText('sfc.again.notYet', { exact: false })).toBeNull();
	});

	it('is not spoken of by a user who has never taken it', () => {
		renderWith(overview(null, true, null));

		expect(screen.queryByRole('button', { name: 'sfc.again.action' })).toBeNull();
	});

	it('says when it becomes possible, while the completed answers still have to stand', () => {
		renderWith(overview('COMPLETED', false, '2026-09-05T14:03:00'));

		const notice = screen.getByText('sfc.again.notYet', { exact: false });
		expect(notice.textContent).toContain('2026');
		expect(notice.textContent).not.toContain('T14');
		expect(screen.queryByRole('button', { name: 'sfc.again.action' })).toBeNull();
	});

	it('asks before replacing what the user is looking at with a blank compass', () => {
		renderWith(overview('COMPLETED', true, '2026-09-05T14:03:00'));

		fireEvent.click(screen.getByRole('button', { name: 'sfc.again.action' }));

		expect(screen.queryByRole('dialog')).not.toBeNull();
		expect(startNewAttemptMock).not.toHaveBeenCalled();
	});

	it('starts a blank attempt once the user says so, and asks the server where things stand after', async () => {
		const { onStarted } = renderWith(overview('COMPLETED', true, '2026-09-05T14:03:00'));
		fireEvent.click(screen.getByRole('button', { name: 'sfc.again.action' }));

		fireEvent.click(screen.getByRole('button', { name: 'sfc.again.confirm' }));

		await waitFor(() => {
			expect(startNewAttemptMock).toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(onStarted).toHaveBeenCalled();
		});
	});

	it('starts nothing when the user thinks better of it', () => {
		renderWith(overview('COMPLETED', true, '2026-09-05T14:03:00'));
		fireEvent.click(screen.getByRole('button', { name: 'sfc.again.action' }));

		fireEvent.click(screen.getByRole('button', { name: 'sfc.cancel' }));

		expect(screen.queryByRole('dialog')).toBeNull();
		expect(startNewAttemptMock).not.toHaveBeenCalled();
	});

	it('says so when a fresh compass could not be started', async () => {
		startNewAttemptMock.mockRejectedValue(new ApiError(409, 'still inside the window'));
		renderWith(overview('COMPLETED', true, '2026-09-05T14:03:00'));
		fireEvent.click(screen.getByRole('button', { name: 'sfc.again.action' }));

		fireEvent.click(screen.getByRole('button', { name: 'sfc.again.confirm' }));

		await waitFor(() => {
			expect(screen.queryByText('sfc.again.failed')).not.toBeNull();
		});
	});
});
