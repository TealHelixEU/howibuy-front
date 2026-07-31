import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionToken } from './handoff';

const redeemTicket = vi.fn<(ticket: string) => Promise<SessionToken>>();

vi.mock('./handoff', () => ({
	redeemTicket: (ticket: string) => redeemTicket(ticket),
	renewSessionToken: () => Promise.reject(new Error('no session of these tests is close enough to expiry to renew')),
}));

vi.mock('@/auth/userManager', () => ({ getAccessToken: () => Promise.resolve('a-token-of-an-OIDC-login') }));

const REDEEMED: SessionToken = { accessToken: 'session-token', expiresInSeconds: 900 };

/** The application as a page load sees it, with whatever the tab remembers of a handed-over session still in place. */
async function freshPage() {
	vi.resetModules();
	const { getAccessToken } = await import('@/auth/session');
	const { ApiError } = await import('@/api/client');
	const { bootstrapHandoffSession } = await import('./handoffBootstrap');
	const handoffSession = await import('./handoffSession');
	return { getAccessToken, ApiError, bootstrapHandoffSession, ...handoffSession };
}

/** The URL the retailer sent the user to, or the one an ordinary visit arrives at. */
function arriveAt(url: string) {
	history.replaceState({}, '', url);
}

beforeEach(() => {
	sessionStorage.clear();
	arriveAt('/sfc');
	redeemTicket.mockReset();
	redeemTicket.mockResolvedValue(REDEEMED);
});

describe('a user the retailer sent over with a ticket', () => {
	it('is working in the session the ticket opens', async () => {
		const page = await freshPage();
		arriveAt('/sfc#ticket=a-ticket');

		await page.bootstrapHandoffSession();

		expect(redeemTicket).toHaveBeenCalledExactlyOnceWith('a-ticket');
		expect(page.handoffSessionState()).toBe('live');
		expect(await page.getAccessToken()).toBe('session-token');
	});

	/**
	 * The ticket is out of the URL before it is ever presented, so that a reload — which is a reload of a page whose ticket
	 * has been spent — has nothing left to present. What the retailer put in the URL besides is left where it is.
	 */
	it('has the ticket out of the URL before it is presented', async () => {
		const page = await freshPage();
		arriveAt('/sfc?from=lime-fresh#ticket=a-ticket');
		let redeemed: (token: SessionToken) => void = () => undefined;
		redeemTicket.mockReturnValue(
			new Promise((resolve) => {
				redeemed = resolve;
			}),
		);

		const bootstrapping = page.bootstrapHandoffSession();

		expect(location.hash).toBe('');
		expect(location.pathname + location.search).toBe('/sfc?from=lime-fresh');
		redeemed(REDEEMED);
		await bootstrapping;
	});

	/**
	 * A ticket that does not work leaves the user in a session that is over, which is a thing the application can say to
	 * them. What it must not do is send them to the OIDC login: they have no account there to log in with.
	 */
	it('is left in a session that is over when the ticket does not work', async () => {
		const page = await freshPage();
		arriveAt('/sfc#ticket=a-ticket-already-spent');
		redeemTicket.mockRejectedValue(new page.ApiError(401, 'the ticket cannot be redeemed'));

		await page.bootstrapHandoffSession();

		expect(page.handoffSessionState()).toBe('ended');
		expect(await page.getAccessToken()).toBeUndefined();
	});

	it('goes on in the same session after a reload, with no ticket to present', async () => {
		(await freshPage()).beginHandoffSession(REDEEMED);

		const reloaded = await freshPage();
		await reloaded.bootstrapHandoffSession();

		expect(redeemTicket).not.toHaveBeenCalled();
		expect(await reloaded.getAccessToken()).toBe('session-token');
	});
});

describe('a user who came on their own', () => {
	it('logs in with the OIDC login, no session having been handed over', async () => {
		const page = await freshPage();

		await page.bootstrapHandoffSession();

		expect(redeemTicket).not.toHaveBeenCalled();
		expect(page.handoffSessionState()).toBe('none');
		expect(await page.getAccessToken()).toBe('a-token-of-an-OIDC-login');
	});

	it('keeps the fragment they followed, which names no ticket', async () => {
		const page = await freshPage();
		arriveAt('/sfc#how-it-works');

		await page.bootstrapHandoffSession();

		expect(location.hash).toBe('#how-it-works');
		expect(redeemTicket).not.toHaveBeenCalled();
	});
});
