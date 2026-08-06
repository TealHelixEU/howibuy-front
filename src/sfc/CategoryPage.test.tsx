import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Outlet, RouterProvider, createMemoryRouter } from 'react-router';
import { ApiError } from '@/api/client';
import type * as SfcModule from './sfc';
import { CategoryPage } from './CategoryPage';
import type { Compass } from './compassContext';
import {
	fetchCategoryQuestions,
	fetchNextQuestion,
	fetchPreviousQuestion,
	saveAnswer,
	type AttemptStatus,
	type CategoryOverview,
	type CompassOverview,
	type Question,
	type SustainabilityDimension,
} from './sfc';

// Only the calls to the API are stood in for. Automocking the whole module would empty SCALE_OPTIONS, which is content,
// not a collaborator.
vi.mock('./sfc', async (importOriginal) => ({
	...(await importOriginal<typeof SfcModule>()),
	fetchNextQuestion: vi.fn(),
	fetchPreviousQuestion: vi.fn(),
	fetchCategoryQuestions: vi.fn(),
	saveAnswer: vi.fn(),
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

const fetchNextQuestionMock = vi.mocked(fetchNextQuestion);
const fetchPreviousQuestionMock = vi.mocked(fetchPreviousQuestion);
const fetchCategoryQuestionsMock = vi.mocked(fetchCategoryQuestions);
const saveAnswerMock = vi.mocked(saveAnswer);

const HEALTH_ID = 'id-of-health';

const LABELS = {
	NOT_IMPORTANT: 'Not important',
	SLIGHTLY_IMPORTANT: 'Slightly important',
	MODERATELY_IMPORTANT: 'Moderately important',
	VERY_IMPORTANT: 'Very important',
	EXTREMELY_IMPORTANT: 'Extremely important',
};

function question(position: number, answer: Question['answer'] = null): Question {
	return { id: `q-${position}`, position, text: `<strong>Question ${position}</strong>`, answer };
}

function category(
	id: string,
	dimension: SustainabilityDimension,
	name: string,
	answered: number,
	total: number,
): CategoryOverview {
	return {
		category: { id, dimension, name, description: 'about it', videoUrl: null, detailUrl: null },
		progress: { answered, total, percentage: Math.round((100 * answered) / total) },
		estimatedSeconds: total * 20,
	};
}

function overviewOf(categories: CategoryOverview[], attemptStatus: AttemptStatus = 'IN_PROGRESS'): CompassOverview {
	const total = categories.reduce((sum, one) => sum + one.progress.total, 0);
	const answered = categories.reduce((sum, one) => sum + one.progress.answered, 0);
	return {
		overallProgress: { answered, total, percentage: Math.round((100 * answered) / total) },
		overallEstimatedSeconds: total * 20,
		categories,
		scaleLabels: LABELS,
		attemptStatus,
		eligibleToStartNewAttempt: false,
		eligibleAt: null,
	};
}

const HEALTH_ONLY = () => overviewOf([category(HEALTH_ID, 'HEALTH', 'Health', 3, 8)]);

function renderCategory(overview: CompassOverview = HEALTH_ONLY(), path = `/sfc/${HEALTH_ID}`) {
	const refresh = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
	const routes = [
		{
			path: '/sfc',
			element: <Outlet context={{ overview, refresh } satisfies Compass} />,
			children: [{ path: ':categoryId', element: <CategoryPage /> }],
		},
	];
	render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
	return { refresh };
}

beforeEach(() => {
	vi.resetAllMocks();
	saveAnswerMock.mockResolvedValue(undefined);
});

describe('working through a category', () => {
	it('puts the question the server says comes next, with the five labelled options', async () => {
		fetchNextQuestionMock.mockResolvedValue({ complete: false, question: question(4) });

		renderCategory();

		await waitFor(() => {
			expect(screen.queryByText('Question 4')).not.toBeNull();
		});
		expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual([
			'NOT_IMPORTANT',
			'SLIGHTLY_IMPORTANT',
			'MODERATELY_IMPORTANT',
			'VERY_IMPORTANT',
			'EXTREMELY_IMPORTANT',
		]);
		expect(screen.queryByRole('radio', { name: 'Very important' })).not.toBeNull();
		expect(screen.queryByText('sfc.question.position(position=4,total=8)')).not.toBeNull();
	});

	it('saves the picked option and moves on to the next question', async () => {
		fetchNextQuestionMock
			.mockResolvedValueOnce({ complete: false, question: question(4) })
			.mockResolvedValueOnce({ complete: false, question: question(5) });
		const { refresh } = renderCategory();
		await waitFor(() => {
			expect(screen.queryByText('Question 4')).not.toBeNull();
		});

		fireEvent.click(screen.getByRole('radio', { name: 'Very important' }));

		await waitFor(() => {
			expect(screen.queryByText('Question 5')).not.toBeNull();
		});
		expect(saveAnswerMock).toHaveBeenCalledWith('q-4', 'VERY_IMPORTANT');
		expect(refresh).toHaveBeenCalled();
	});

	it('offers no step back from the first question of a category', async () => {
		fetchNextQuestionMock.mockResolvedValue({ complete: false, question: question(1) });

		renderCategory();

		await waitFor(() => {
			expect(screen.queryByText('Question 1')).not.toBeNull();
		});
		expect(screen.queryByRole('link', { name: 'sfc.question.previous' })).toBeNull();
	});

	it('steps back to the last answered question, showing what was picked and no further step back', async () => {
		fetchNextQuestionMock.mockResolvedValue({ complete: false, question: question(4) });
		fetchPreviousQuestionMock.mockResolvedValue({ atStart: false, question: question(3, 'NOT_IMPORTANT') });
		renderCategory();
		await waitFor(() => {
			expect(screen.queryByText('Question 4')).not.toBeNull();
		});

		fireEvent.click(screen.getByRole('link', { name: 'sfc.question.previous' }));

		await waitFor(() => {
			expect(screen.queryByText('Question 3')).not.toBeNull();
		});
		expect((screen.getByRole('radio', { name: 'Not important' }) as HTMLInputElement).checked).toBe(true);
		expect(screen.queryByRole('link', { name: 'sfc.question.previous' })).toBeNull();
		expect(screen.queryByRole('link', { name: 'sfc.question.backToCurrent' })).not.toBeNull();
	});

	it('answering a question it stepped back to returns to the question that was next', async () => {
		fetchNextQuestionMock.mockResolvedValue({ complete: false, question: question(4) });
		fetchPreviousQuestionMock.mockResolvedValue({ atStart: false, question: question(3, 'NOT_IMPORTANT') });
		renderCategory();
		await waitFor(() => {
			expect(screen.queryByText('Question 4')).not.toBeNull();
		});
		fireEvent.click(screen.getByRole('link', { name: 'sfc.question.previous' }));
		await waitFor(() => {
			expect(screen.queryByText('Question 3')).not.toBeNull();
		});

		fireEvent.click(screen.getByRole('radio', { name: 'Extremely important' }));

		await waitFor(() => {
			expect(screen.queryByText('Question 4')).not.toBeNull();
		});
		expect(saveAnswerMock).toHaveBeenCalledWith('q-3', 'EXTREMELY_IMPORTANT');
	});

	it('says so and stays put when an answer cannot be saved', async () => {
		fetchNextQuestionMock.mockResolvedValue({ complete: false, question: question(4) });
		saveAnswerMock.mockRejectedValue(new ApiError(503, 'the API is not answering'));
		renderCategory();
		await waitFor(() => {
			expect(screen.queryByText('Question 4')).not.toBeNull();
		});

		fireEvent.click(screen.getByRole('radio', { name: 'Very important' }));

		await waitFor(() => {
			expect(screen.queryByText('sfc.answerFailed')).not.toBeNull();
		});
		expect(screen.queryByText('Question 4')).not.toBeNull();
	});

	it('says the answers are locked when saving is refused as out of time', async () => {
		fetchNextQuestionMock.mockResolvedValue({ complete: false, question: question(4) });
		saveAnswerMock.mockRejectedValue(new ApiError(409, 'the window is still open'));
		const { refresh } = renderCategory();
		await waitFor(() => {
			expect(screen.queryByText('Question 4')).not.toBeNull();
		});

		fireEvent.click(screen.getByRole('radio', { name: 'Very important' }));

		await waitFor(() => {
			expect(screen.queryByText('sfc.answerRefused')).not.toBeNull();
		});
		expect(refresh).toHaveBeenCalled();
	});
});

describe('looking back over a finished category', () => {
	it('lists every question with the answer given, and the way to the other categories', async () => {
		fetchNextQuestionMock.mockResolvedValue({ complete: true, question: null });
		fetchCategoryQuestionsMock.mockResolvedValue([question(1, 'NOT_IMPORTANT'), question(2, 'VERY_IMPORTANT')]);

		renderCategory(
			overviewOf([
				category(HEALTH_ID, 'HEALTH', 'Health', 8, 8),
				category('id-of-social', 'SOCIAL', 'Social', 2, 10),
			]),
		);

		await waitFor(() => {
			expect(screen.queryByText('Question 1')).not.toBeNull();
		});
		expect(screen.queryByText('Not important')).not.toBeNull();
		expect(screen.queryByText('Very important')).not.toBeNull();
		const toSocial = screen.getByRole('link', { name: /Social/ });
		expect(toSocial.getAttribute('href')).toBe('/sfc/id-of-social');
		expect(screen.queryByRole('link', { name: /Health/ })).toBeNull();
	});

	it('reaches the whole category as soon as the last question is answered', async () => {
		fetchNextQuestionMock
			.mockResolvedValueOnce({ complete: false, question: question(8) })
			.mockResolvedValueOnce({ complete: true, question: null });
		fetchCategoryQuestionsMock.mockResolvedValue([question(8, 'VERY_IMPORTANT')]);
		renderCategory();
		await waitFor(() => {
			expect(screen.getByRole('radio', { name: 'Very important' })).not.toBeNull();
		});

		fireEvent.click(screen.getByRole('radio', { name: 'Very important' }));

		await waitFor(() => {
			expect(screen.queryByText('sfc.question.revisit')).not.toBeNull();
		});
		expect(screen.queryByRole('radio')).toBeNull();
	});

	it('revisits one answer in place, leaving the rest of the list alone', async () => {
		fetchNextQuestionMock.mockResolvedValue({ complete: true, question: null });
		fetchCategoryQuestionsMock
			.mockResolvedValueOnce([question(1, 'NOT_IMPORTANT'), question(2, 'VERY_IMPORTANT')])
			.mockResolvedValueOnce([question(1, 'EXTREMELY_IMPORTANT'), question(2, 'VERY_IMPORTANT')]);
		renderCategory();
		await waitFor(() => {
			expect(screen.queryByText('Question 1')).not.toBeNull();
		});

		fireEvent.click(screen.getAllByRole('button', { name: 'sfc.question.revisit' })[0]!);
		expect(screen.getAllByRole('radio')).toHaveLength(5);
		fireEvent.click(screen.getByRole('radio', { name: 'Extremely important' }));

		await waitFor(() => {
			expect(screen.queryByText('Extremely important')).not.toBeNull();
		});
		expect(saveAnswerMock).toHaveBeenCalledWith('q-1', 'EXTREMELY_IMPORTANT');
		expect(screen.queryByRole('radio')).toBeNull();
	});

	it('offers to commit the compass there, when finishing this category finished the whole of it', async () => {
		fetchNextQuestionMock.mockResolvedValue({ complete: true, question: null });
		fetchCategoryQuestionsMock.mockResolvedValue([question(1, 'NOT_IMPORTANT')]);

		renderCategory(overviewOf([category(HEALTH_ID, 'HEALTH', 'Health', 8, 8)]));

		await waitFor(() => {
			expect(screen.queryByRole('button', { name: 'sfc.complete.action' })).not.toBeNull();
		});
	});

	it('does not offer to revisit an answer once the compass is completed', async () => {
		fetchNextQuestionMock.mockResolvedValue({ complete: true, question: null });
		fetchCategoryQuestionsMock.mockResolvedValue([question(1, 'NOT_IMPORTANT')]);

		renderCategory(overviewOf([category(HEALTH_ID, 'HEALTH', 'Health', 8, 8)], 'COMPLETED'));

		await waitFor(() => {
			expect(screen.queryByText('Question 1')).not.toBeNull();
		});
		expect(screen.queryByText('Not important')).not.toBeNull();
		expect(screen.queryByRole('button', { name: 'sfc.question.revisit' })).toBeNull();
	});
});

describe('a category that is not there', () => {
	it('is not found, rather than an empty questionnaire', async () => {
		renderCategory(HEALTH_ONLY(), '/sfc/made-up');

		await waitFor(() => {
			expect(screen.queryByText('notFound.title', { exact: false })).not.toBeNull();
		});
		expect(fetchNextQuestionMock).not.toHaveBeenCalled();
	});
});
