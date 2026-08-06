import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, configureApiServerHost } from '@/api/client';
import {
	completeAttempt,
	fetchCategoryQuestions,
	fetchNextQuestion,
	fetchOverview,
	fetchPreviousQuestion,
	saveAnswer,
	startNewAttempt,
} from './sfc';

vi.mock('@/auth/session', () => ({ getAccessToken: () => Promise.resolve('a-token-the-login-left-behind') }));
vi.mock('@/i18n', () => ({ currentLanguage: () => 'el' }));

const fetchMock = vi.fn<typeof fetch>();

/** The one request that was sent. */
function sentRequest() {
	const [url, init] = fetchMock.mock.calls[0] ?? [];
	return { url, method: init?.method ?? 'GET', body: init?.body, headers: new Headers(init?.headers) };
}

function respondWith(body: unknown) {
	fetchMock.mockResolvedValue(
		new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }),
	);
}

function respondWithNothing() {
	fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
}

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
	configureApiServerHost('https://api.test');
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('reading the compass', () => {
	it('asks for the overview in the language the app is showing, as the signed-in user', async () => {
		respondWith({ overallProgress: { answered: 3, total: 43, percentage: 7 } });

		const overview = await fetchOverview();

		expect(sentRequest().url).toBe('https://api.test/sfc/overview?lang=el');
		expect(sentRequest().headers.get('Authorization')).toBe('Bearer a-token-the-login-left-behind');
		expect(overview.overallProgress).toEqual({ answered: 3, total: 43, percentage: 7 });
	});

	it('asks for one category’s questions with the answers already given', async () => {
		respondWith([{ id: 'q-1', position: 1, text: 'Water use', answer: 'VERY_IMPORTANT' }]);

		const questions = await fetchCategoryQuestions('cat-1');

		expect(sentRequest().url).toBe('https://api.test/sfc/categories/cat-1/questions?lang=el');
		expect(questions[0]?.answer).toBe('VERY_IMPORTANT');
	});

	it('asks the server which question comes next in a category', async () => {
		respondWith({ complete: false, question: { id: 'q-4', position: 4, text: 'Land use', answer: null } });

		const next = await fetchNextQuestion('cat-1');

		expect(sentRequest().url).toBe('https://api.test/sfc/categories/cat-1/next-question?lang=el');
		expect(next.question?.position).toBe(4);
	});

	it('asks the server which question to step back to in a category', async () => {
		respondWith({
			atStart: false,
			question: { id: 'q-3', position: 3, text: 'Water use', answer: 'NOT_IMPORTANT' },
		});

		const previous = await fetchPreviousQuestion('cat-1');

		expect(sentRequest().url).toBe('https://api.test/sfc/categories/cat-1/previous-question?lang=el');
		expect(previous.question?.answer).toBe('NOT_IMPORTANT');
	});
});

describe('working through the compass', () => {
	it('saves an answer against its question, carrying no language of its own', async () => {
		respondWithNothing();

		await saveAnswer('q-1', 'MODERATELY_IMPORTANT');

		const request = sentRequest();
		expect(request.url).toBe('https://api.test/sfc/questions/q-1/answer');
		expect(request.method).toBe('PUT');
		expect(request.body).toBe('{"option":"MODERATELY_IMPORTANT"}');
	});

	it('completes the attempt in progress', async () => {
		respondWithNothing();

		await completeAttempt();

		expect(sentRequest().url).toBe('https://api.test/sfc/attempts/current/completion');
		expect(sentRequest().method).toBe('POST');
	});

	it('starts a new attempt for a user taking the compass again', async () => {
		respondWithNothing();

		await startNewAttempt();

		expect(sentRequest().url).toBe('https://api.test/sfc/attempts');
		expect(sentRequest().method).toBe('POST');
	});

	it('passes on a refusal with the status and body the API gave, so the caller can tell why', async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ unansweredQuestionIds: ['q-7'] }), {
				status: 422,
				headers: { 'Content-Type': 'application/json' },
			}),
		);

		const failure = await completeAttempt().catch((e: unknown) => e);

		expect(failure).toBeInstanceOf(ApiError);
		expect((failure as ApiError).status).toBe(422);
		expect((failure as ApiError).body).toEqual({ unansweredQuestionIds: ['q-7'] });
	});
});
