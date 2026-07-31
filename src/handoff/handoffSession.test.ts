import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { getAccessToken } from '@/auth/session';
import type * as HandoffModule from './handoff';
import type { SessionToken } from './handoff';
import { beginHandoffSession, handoffSessionState, resumeHandoffSession } from './handoffSession';

const renewSessionToken = vi.fn<(accessToken: string) => Promise<SessionToken>>();

// Only the request is stood in for; whether a failure of it was a refusal is the data layer's own reading of it.
vi.mock('./handoff', async (importOriginal) => ({
	...(await importOriginal<typeof HandoffModule>()),
	renewSessionToken: (accessToken: string) => renewSessionToken(accessToken),
}));

const REDEEMED: SessionToken = { accessToken: 'session-token', expiresInSeconds: 900 };
const RENEWED: SessionToken = { accessToken: 'next-token', expiresInSeconds: 900 };

/**
 * The application as a freshly loaded page sees it — every module run again from nothing, while whatever the tab remembers
 * of a handed-over session is still there. Only a reload is told by this; the rest of these tests are one page load, which
 * is also what keeps a failure they raise recognizable as the {@code ApiError} it is.
 */
async function freshPage() {
	vi.resetModules();
	const { getAccessToken: freshGetAccessToken } = await import('@/auth/session');
	const handoffSession = await import('./handoffSession');
	return { ...handoffSession, getAccessToken: freshGetAccessToken };
}

/** Move to the moment a token with {@code secondsLeft} of life left would be used. */
function secondsBeforeExpiry(secondsLeft: number) {
	vi.advanceTimersByTime((REDEEMED.expiresInSeconds - secondsLeft) * 1000);
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-07-31T12:00:00Z'));
	sessionStorage.clear();
	renewSessionToken.mockReset();
	renewSessionToken.mockResolvedValue(RENEWED);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('a session handed over from a retailer', () => {
	it('answers the token its ticket was redeemed for', async () => {
		beginHandoffSession(REDEEMED);

		expect(await getAccessToken()).toBe('session-token');
		expect(handoffSessionState()).toBe('live');
	});

	it('is what a tab is in until it is handed one', () => {
		expect(handoffSessionState()).toBe('none');
		expect(resumeHandoffSession()).toBe(false);
	});

	/**
	 * The tab remembers the session across the reloads a browser does on its own, so a reload is the same session going on
	 * rather than a user thrown out of it. Nothing of it outlives the tab.
	 */
	it('goes on after a reload', async () => {
		beginHandoffSession(REDEEMED);

		const reloaded = await freshPage();

		expect(reloaded.resumeHandoffSession()).toBe(true);
		expect(await reloaded.getAccessToken()).toBe('session-token');
	});
});

describe('the token a handed-over session runs on', () => {
	it('is used as it is while it has life left in it', async () => {
		beginHandoffSession(REDEEMED);

		secondsBeforeExpiry(300);

		expect(await getAccessToken()).toBe('session-token');
		expect(renewSessionToken).not.toHaveBeenCalled();
	});

	it('is renewed as it comes close to expiry, and the next one used from then on', async () => {
		beginHandoffSession(REDEEMED);

		secondsBeforeExpiry(60);

		expect(await getAccessToken()).toBe('next-token');
		expect(await getAccessToken()).toBe('next-token');
		expect(renewSessionToken).toHaveBeenCalledExactlyOnceWith('session-token');
	});

	/**
	 * Requests do not wait for one another, so several can want the token at once. They renew it once between them: a second
	 * renewal would be spent on the token the first one has just replaced.
	 */
	it('is renewed once however many requests want it at that moment', async () => {
		beginHandoffSession(REDEEMED);

		secondsBeforeExpiry(60);
		const tokens = await Promise.all([getAccessToken(), getAccessToken(), getAccessToken()]);

		expect(tokens).toEqual(['next-token', 'next-token', 'next-token']);
		expect(renewSessionToken).toHaveBeenCalledExactlyOnceWith('session-token');
	});
});

describe('a handed-over session that is over', () => {
	/**
	 * The application renews ahead of expiry rather than after it, because an expired token is refused: past that moment
	 * there is nothing left to ask, and asking would only spend a round trip on the same answer.
	 */
	it('is over the moment its token expires, and nothing is asked of the API', async () => {
		beginHandoffSession(REDEEMED);

		secondsBeforeExpiry(0);

		expect(await getAccessToken()).toBeUndefined();
		expect(handoffSessionState()).toBe('sessionOver');
		expect(renewSessionToken).not.toHaveBeenCalled();
	});

	/** How the end of the session — which the application is never told — makes itself known. */
	it('is over once the API refuses to renew it', async () => {
		beginHandoffSession(REDEEMED);
		renewSessionToken.mockRejectedValue(new ApiError(401, 'the token cannot be renewed'));

		secondsBeforeExpiry(60);

		expect(await getAccessToken()).toBeUndefined();
		expect(handoffSessionState()).toBe('sessionOver');
	});

	/**
	 * A renewal that never reached the API says nothing about the session: the token it was to replace is still good for a
	 * while, so the session runs on it and the next request renews again.
	 */
	it('is not over because a renewal could not be delivered', async () => {
		beginHandoffSession(REDEEMED);
		renewSessionToken.mockRejectedValue(new TypeError('Failed to fetch'));

		secondsBeforeExpiry(60);

		expect(await getAccessToken()).toBe('session-token');
		expect(handoffSessionState()).toBe('live');
	});
});
