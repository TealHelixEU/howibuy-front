import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, configureApiServerHost } from '@/api/client';
import { redeemTicket, renewSessionToken, wasRefused } from './handoff';

const sessionAccessToken = vi.fn<() => Promise<string | undefined>>();

vi.mock('@/auth/session', () => ({ getAccessToken: () => sessionAccessToken() }));

const fetchMock = vi.fn<typeof fetch>();

/** The one request that was sent. */
function sentRequest() {
	const [url, init] = fetchMock.mock.calls[0] ?? [];
	return { url, method: init?.method, body: init?.body, headers: new Headers(init?.headers) };
}

function respondWith(body: unknown) {
	fetchMock.mockResolvedValue(
		new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }),
	);
}

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
	sessionAccessToken.mockReset();
	sessionAccessToken.mockResolvedValue('a-token-an-earlier-login-left-behind');
	configureApiServerHost('https://api.test');
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('redeeming the ticket a retailer sent the user over with', () => {
	it('answers the first token of the session the ticket opens', async () => {
		respondWith({ access_token: 'session-token', expires_in: 900 });

		const session = await redeemTicket('a-ticket');

		const request = sentRequest();
		expect(request.url).toBe('https://api.test/handoff/redeem');
		expect(request.method).toBe('POST');
		expect(request.body).toBe('{"ticket":"a-ticket"}');
		expect(session).toEqual({ accessToken: 'session-token', expiresInSeconds: 900 });
	});

	/**
	 * The ticket is the only credential a redeem has, and a token an earlier login left behind cannot help it: an expired
	 * one is refused before the endpoint is ever reached, killing a redeem that would have worked.
	 */
	it('carries no token of its own', async () => {
		respondWith({ access_token: 'session-token', expires_in: 900 });

		await redeemTicket('a-ticket');

		expect(sentRequest().headers.has('Authorization')).toBe(false);
		expect(sessionAccessToken).not.toHaveBeenCalled();
	});
});

describe('renewing the token a handed-over session runs on', () => {
	/**
	 * The token to renew is named by the caller rather than asked of the session, because the session answers a token by
	 * renewing it when it is close to expiry — asking here would be asking a renewal to start a renewal.
	 */
	it('answers the next token of the session, carrying the one it renews', async () => {
		respondWith({ access_token: 'next-token', expires_in: 900 });

		const session = await renewSessionToken('current-token');

		const request = sentRequest();
		expect(request.url).toBe('https://api.test/handoff/renew');
		expect(request.method).toBe('POST');
		expect(request.headers.get('Authorization')).toBe('Bearer current-token');
		expect(sessionAccessToken).not.toHaveBeenCalled();
		expect(session).toEqual({ accessToken: 'next-token', expiresInSeconds: 900 });
	});
});

describe('a failure of a handoff request', () => {
	/**
	 * A refusal is the API's verdict on the ticket or the token presented, and will not read differently a moment later. A
	 * request that never arrived, or a server that broke answering it, is no verdict on anything.
	 */
	it('is a refusal only when the API answered it as one', () => {
		expect(wasRefused(new ApiError(401, 'the ticket cannot be redeemed'))).toBe(true);
		expect(wasRefused(new ApiError(503, 'come back later'))).toBe(false);
		expect(wasRefused(new TypeError('Failed to fetch'))).toBe(false);
	});
});
