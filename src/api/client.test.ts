import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, configureApiServerHost } from './client';

const accessToken = vi.fn<() => Promise<string | undefined>>();

vi.mock('@/auth/session', () => ({ getAccessToken: () => accessToken() }));

const fetchMock = vi.fn<typeof fetch>();

/** The headers of the one request that was sent. */
function sentHeaders() {
	return new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
}

describe('apiFetch', () => {
	beforeEach(() => {
		fetchMock.mockReset();
		fetchMock.mockResolvedValue(
			new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }),
		);
		vi.stubGlobal('fetch', fetchMock);
		accessToken.mockReset();
		configureApiServerHost('https://api.test');
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('carries the token of the session, whichever login it came from', async () => {
		accessToken.mockResolvedValue('session-token');

		await apiFetch('/greeting');

		expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.test/greeting');
		expect(sentHeaders().get('Authorization')).toBe('Bearer session-token');
	});

	it('carries no authorization at all when the session has no token', async () => {
		accessToken.mockResolvedValue(undefined);

		await apiFetch('/greeting');

		expect(sentHeaders().has('Authorization')).toBe(false);
	});

	/**
	 * The status is what tells a refused credential apart from a request that never arrived, so it travels with the failure
	 * rather than only inside its message.
	 */
	it('fails with the status the endpoint answered', async () => {
		accessToken.mockResolvedValue('session-token');
		fetchMock.mockResolvedValue(
			new Response('{"error":"refused"}', { status: 401, headers: { 'Content-Type': 'application/json' } }),
		);

		const failure = apiFetch('/handoff/renew');

		await expect(failure).rejects.toBeInstanceOf(ApiError);
		await expect(failure).rejects.toMatchObject({ status: 401, body: { error: 'refused' } });
	});
});
