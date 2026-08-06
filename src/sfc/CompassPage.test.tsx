import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Outlet, RouterProvider, createMemoryRouter } from 'react-router';
import { CompassPage } from './CompassPage';
import type { Compass } from './compassContext';
import type { CategoryOverview, CompassOverview, SustainabilityDimension } from './sfc';

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

function category(dimension: SustainabilityDimension, name: string, answered: number, total: number): CategoryOverview {
	return {
		category: {
			id: `id-of-${dimension.toLowerCase()}`,
			dimension,
			name,
			description: `<strong>${name}</strong> matters because of this.`,
			videoUrl: null,
			detailUrl: null,
		},
		progress: { answered, total, percentage: Math.round((100 * answered) / total) },
		estimatedSeconds: total * 20,
	};
}

function overviewOf(categories: CategoryOverview[]): CompassOverview {
	const total = categories.reduce((sum, one) => sum + one.progress.total, 0);
	const answered = categories.reduce((sum, one) => sum + one.progress.answered, 0);
	return {
		overallProgress: { answered, total, percentage: Math.round((100 * answered) / total) },
		overallEstimatedSeconds: total * 20,
		categories,
		scaleLabels: {
			NOT_IMPORTANT: 'Not important',
			SLIGHTLY_IMPORTANT: 'Slightly important',
			MODERATELY_IMPORTANT: 'Moderately important',
			VERY_IMPORTANT: 'Very important',
			EXTREMELY_IMPORTANT: 'Extremely important',
		},
		attemptStatus: 'IN_PROGRESS',
		eligibleToStartNewAttempt: false,
		eligibleAt: null,
	};
}

function renderCompass(overview: CompassOverview) {
	const compass: Compass = { overview, refresh: vi.fn() };
	const routes = [
		{
			path: '/sfc',
			element: <Outlet context={compass} />,
			children: [{ index: true, element: <CompassPage /> }],
		},
	];
	return render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/sfc'] })} />);
}

describe('the compass as a whole', () => {
	it('shows how far the user has got overall, and how long the whole thing takes', () => {
		renderCompass(overviewOf([category('HEALTH', 'Health', 4, 8), category('ECONOMIC', 'Economic', 0, 3)]));

		expect(screen.queryByText('sfc.progress.overall(answered=4,total=11,percentage=36)')).not.toBeNull();
		expect(screen.queryByText('sfc.estimate.total(minutes=4)')).not.toBeNull();
		expect(screen.getByRole('progressbar', { name: 'sfc.progress.overallLabel' })).not.toBeNull();
	});

	it('shows the categories in the compass’s own order, not the order the API sent them', () => {
		renderCompass(
			// As the API sends them: by the dimension's stored name.
			overviewOf([
				category('ANIMAL_WELFARE', 'Animal welfare', 0, 11),
				category('ECOLOGICAL', 'Ecological', 0, 11),
				category('ECONOMIC', 'Economic', 0, 3),
				category('HEALTH', 'Health', 0, 8),
				category('SOCIAL', 'Social', 0, 10),
			]),
		);

		const names = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
		expect(names).toEqual(['Ecological', 'Social', 'Economic', 'Health', 'Animal welfare']);
	});

	it('links each category to its own questions and shows its progress and estimate', () => {
		renderCompass(overviewOf([category('HEALTH', 'Health', 4, 8)]));

		const link = screen.getByRole('link', { name: /Health/ });
		expect(link.getAttribute('href')).toBe('/sfc/id-of-health');
		expect(screen.queryByText('sfc.progress.category(answered=4,total=8)')).not.toBeNull();
		expect(screen.queryByText('sfc.estimate.category(minutes=3)')).not.toBeNull();
		expect(screen.getByRole('progressbar', { name: 'Health' })).not.toBeNull();
	});

	it('renders the category description as the rich text it is', () => {
		const { container } = renderCompass(overviewOf([category('HEALTH', 'Health', 0, 8)]));

		expect(container.querySelector('.card-body strong')?.textContent).toBe('Health');
	});

	it('invites the user to start, carry on, or review, by how far into a category they are', () => {
		renderCompass(
			overviewOf([
				category('ECOLOGICAL', 'Untouched', 0, 11),
				category('SOCIAL', 'Under way', 4, 10),
				category('HEALTH', 'Finished', 8, 8),
			]),
		);

		expect(screen.queryByText('sfc.category.start')).not.toBeNull();
		expect(screen.queryByText('sfc.category.continue')).not.toBeNull();
		expect(screen.queryByText('sfc.category.review')).not.toBeNull();
	});
});
