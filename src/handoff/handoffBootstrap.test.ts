import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { getAccessToken } from '@/auth/session';
import type * as HandoffModule from './handoff';
import type { SessionToken } from './handoff';
import { bootstrapHandoffSession } from './handoffBootstrap';
import { beginHandoffSession, endHandoffSession, handoffSessionState } from './handoffSession';

const redeemTicket = vi.fn<(ticket: string) => Promise<SessionToken>>();

// Only the requests are stood in for; whether a failure of one was a refusal is the data layer's own reading of it.
vi.mock('./handoff', async (importOriginal) => ({
	...(await importOriginal<typeof HandoffModule>()),
	redeemTicket: (ticket: string) => redeemTicket(ticket),
	renewSessionToken: () => Promise.reject(new Error('no session of these tests is close enough to expiry to renew')),
}));

vi.mock('@/auth/userManager', () => ({ getAccessToken: () => Promise.resolve('a-token-of-an-OIDC-login') }));

const REDEEMED: SessionToken = { accessToken: 'session-token', expiresInSeconds: 900 };

/** Kept quiet so that what a test drives on purpose does not read as something wrong with the run. */
const warned = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

/**
 * The application as a freshly loaded page sees it — every module run again from nothing, while whatever the tab remembers
 * of a handed-over session is still there. Only what a page load starts from is told by this; the rest of these tests drive
 * the one page load they are part of, which is also what keeps a failure they raise recognizable as the {@code ApiError} it
 * is.
 */
async function freshPage() {
	vi.resetModules();
	const { getAccessToken: freshGetAccessToken } = await import('@/auth/session');
	const { bootstrapHandoffSession: freshBootstrap } = await import('./handoffBootstrap');
	const handoffSession = await import('./handoffSession');
	return { ...handoffSession, bootstrapHandoffSession: freshBootstrap, getAccessToken: freshGetAccessToken };
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
	warned.mockClear();
});

describe('a user the retailer sent over with a ticket', () => {
	it('is working in the session the ticket opens', async () => {
		arriveAt('/sfc#ticket=a-ticket');

		await bootstrapHandoffSession();

		expect(redeemTicket).toHaveBeenCalledExactlyOnceWith('a-ticket');
		expect(handoffSessionState()).toBe('live');
		expect(await getAccessToken()).toBe('session-token');
		expect(warned).not.toHaveBeenCalled();
	});

	/**
	 * The ticket is out of the URL before it is ever presented, so that a reload — which is a reload of a page whose ticket
	 * has been spent — has nothing left to present. What the retailer put in the URL besides is left where it is.
	 */
	it('has the ticket out of the URL before it is presented', async () => {
		arriveAt('/sfc?from=lime-fresh#ticket=a-ticket');
		let redeemed: (token: SessionToken) => void = () => undefined;
		redeemTicket.mockReturnValue(
			new Promise((resolve) => {
				redeemed = resolve;
			}),
		);

		const bootstrapping = bootstrapHandoffSession();

		expect(location.hash).toBe('');
		expect(location.pathname + location.search).toBe('/sfc?from=lime-fresh');
		redeemed(REDEEMED);
		await bootstrapping;
	});

	/**
	 * A refused ticket is spent or expired, and only the retailer can hand out another. What the user must not be sent to is
	 * the OIDC login: they have no account there to log in with.
	 */
	it('is left knowing the link did not work when the ticket was refused', async () => {
		arriveAt('/sfc#ticket=a-ticket-already-spent');
		const refusal = new ApiError(401, 'the ticket cannot be redeemed');
		redeemTicket.mockRejectedValue(refusal);

		await bootstrapHandoffSession();

		expect(handoffSessionState()).toBe('linkRefused');
		expect(await getAccessToken()).toBeUndefined();
		expect(warned).toHaveBeenCalledExactlyOnceWith('The handoff ticket could not be redeemed', refusal);
	});

	/**
	 * A redeem that got no answer says nothing about the ticket, which may well have been good. The user is told that much,
	 * so that trying again from the shop is worth their while rather than a puzzle.
	 *
	 * What the user is told is what they can act on, which is never the whole of what happened. The failure itself goes to
	 * the console, because only the status it carries tells a ticket the API refused from a request something between the
	 * browser and the API turned away — and the two want doing something about by different people.
	 */
	it('is left knowing the service was unreachable when the redeem got no answer', async () => {
		arriveAt('/sfc#ticket=a-ticket');
		const failure = new TypeError('Failed to fetch');
		redeemTicket.mockRejectedValue(failure);

		await bootstrapHandoffSession();

		expect(handoffSessionState()).toBe('serviceUnreachable');
		expect(warned).toHaveBeenCalledExactlyOnceWith('The handoff ticket could not be redeemed', failure);
	});

	/**
	 * Reloading is what a user does when told the session is over, the link they still have in the address bar looking like
	 * it ought to work. They are told the same thing again — and above all are not sent to the OIDC login, which has no
	 * account of theirs, nor given whatever token an earlier login of this browser left behind.
	 */
	it('is told the same again on a reload once the session is over', async () => {
		endHandoffSession('sessionOver');

		const reloaded = await freshPage();
		await reloaded.bootstrapHandoffSession();

		expect(reloaded.handoffSessionState()).toBe('sessionOver');
		expect(await reloaded.getAccessToken()).toBeUndefined();
		expect(redeemTicket).not.toHaveBeenCalled();
	});

	it('goes on in the same session after a reload, with no ticket to present', async () => {
		beginHandoffSession(REDEEMED);

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
		arriveAt('/sfc#how-it-works');

		await bootstrapHandoffSession();

		expect(location.hash).toBe('#how-it-works');
		expect(redeemTicket).not.toHaveBeenCalled();
	});
});
