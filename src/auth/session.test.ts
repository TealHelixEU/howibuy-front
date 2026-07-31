import { beforeEach, describe, expect, it, vi } from 'vitest';

const oidcAccessToken = vi.fn<() => Promise<string | undefined>>();

vi.mock('./userManager', () => ({ getAccessToken: () => oidcAccessToken() }));

/** A fresh copy of the module, so a source one test installs is no longer in place for the next. */
async function freshSession() {
	vi.resetModules();
	return import('./session');
}

describe('the access token a request carries', () => {
	beforeEach(() => {
		oidcAccessToken.mockReset();
		oidcAccessToken.mockResolvedValue('oidc-token');
	});

	it('comes from the OIDC login while nothing has taken over', async () => {
		const session = await freshSession();

		expect(await session.getAccessToken()).toBe('oidc-token');
	});

	it('comes from the source that has taken over', async () => {
		const session = await freshSession();

		session.configureAccessTokenSource(() => Promise.resolve('handoff-token'));

		expect(await session.getAccessToken()).toBe('handoff-token');
		expect(oidcAccessToken).not.toHaveBeenCalled();
	});

	/**
	 * A session that has taken over and has no token to give is over, and the OIDC login is not a second chance at it: the
	 * user of a handed-over session has none, so falling back would send them to a login they cannot complete.
	 */
	it('is absent, not the OIDC one, when the source that has taken over has none', async () => {
		const session = await freshSession();

		session.configureAccessTokenSource(() => Promise.resolve(undefined));

		expect(await session.getAccessToken()).toBeUndefined();
		expect(oidcAccessToken).not.toHaveBeenCalled();
	});
});
