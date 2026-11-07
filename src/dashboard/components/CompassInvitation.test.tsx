import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryRouter } from 'react-router';
import type { AttemptStatus, CompassOverview } from '@/sfc/sfc';
import { CompassInvitation } from './CompassInvitation';

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

function overview(attemptStatus: AttemptStatus | null, hasCompletedAttempt: boolean): CompassOverview {
	const answered = attemptStatus === null ? 0 : 12;
	return {
		overallProgress: { answered, total: 43, percentage: Math.round((100 * answered) / 43) },
		overallEstimatedSeconds: 660,
		categories: [],
		scaleLabels: {
			NOT_IMPORTANT: 'Not important',
			SLIGHTLY_IMPORTANT: 'Slightly important',
			MODERATELY_IMPORTANT: 'Moderately important',
			VERY_IMPORTANT: 'Very important',
			EXTREMELY_IMPORTANT: 'Extremely important',
		},
		attemptStatus,
		hasCompletedAttempt,
		eligibleToStartNewAttempt: false,
		eligibleAt: null,
	};
}

function renderInvitation(compassOverview: CompassOverview) {
	return render(
		<RouterProvider
			router={createMemoryRouter([{ path: '/', element: <CompassInvitation overview={compassOverview} /> }])}
		/>,
	);
}

describe('the invitation to the compass', () => {
	it('invites a user who has never started it to take it, saying how long it takes', () => {
		renderInvitation(overview(null, false));

		expect(screen.queryByRole('heading', { name: 'dashboard.invitation.start.title' })).not.toBeNull();
		expect(screen.queryByText('dashboard.invitation.start.text')).not.toBeNull();
		expect(screen.queryByText('sfc.estimate.total(minutes=11)')).not.toBeNull();
		expect(screen.queryByRole('progressbar')).toBeNull();
		expect(screen.getByRole('link', { name: 'dashboard.invitation.start.action' }).getAttribute('href')).toBe(
			'/sfc',
		);
	});

	it('asks a user on their first attempt to finish it, showing how far they have got', () => {
		renderInvitation(overview('IN_PROGRESS', false));

		expect(screen.queryByRole('heading', { name: 'dashboard.invitation.firstAttempt.title' })).not.toBeNull();
		expect(screen.queryByText('dashboard.invitation.firstAttempt.text')).not.toBeNull();
		expect((screen.getByRole('progressbar') as HTMLProgressElement).value).toBe(28);
		expect(screen.queryByText('sfc.progress.overall(answered=12,total=43,percentage=28)')).not.toBeNull();
		expect(screen.queryByText(/^sfc\.estimate/)).toBeNull();
		expect(screen.getByRole('link', { name: 'dashboard.invitation.continue' }).getAttribute('href')).toBe('/sfc');
	});

	it('asks a user retaking it to finish, their baskets being matched against their last priorities until then', () => {
		renderInvitation(overview('IN_PROGRESS', true));

		expect(screen.queryByRole('heading', { name: 'dashboard.invitation.retake.title' })).not.toBeNull();
		expect(screen.queryByText('dashboard.invitation.retake.text')).not.toBeNull();
		expect(screen.queryByText('sfc.progress.overall(answered=12,total=43,percentage=28)')).not.toBeNull();
		expect(screen.queryByRole('link', { name: 'dashboard.invitation.continue' })).not.toBeNull();
	});

	it('is not there once the compass is completed', () => {
		renderInvitation(overview('COMPLETED', true));

		expect(screen.queryByRole('heading')).toBeNull();
		expect(screen.queryByRole('link')).toBeNull();
	});
});
