import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { beginHandoffSession, endHandoffSession } from '@/handoff/handoffSession';
import { RequireAuth } from './RequireAuth';

const auth = {
	isLoading: false,
	isAuthenticated: false,
	activeNavigator: undefined as string | undefined,
	error: undefined as Error | undefined,
	signinRedirect: vi.fn(() => Promise.resolve()),
};

vi.mock('react-oidc-context', () => ({ useAuth: () => auth }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const REDEEMED = { accessToken: 'session-token', expiresInSeconds: 900 };

function renderGuarded() {
	return render(
		<RequireAuth>
			<span>the application</span>
		</RequireAuth>,
	);
}

beforeEach(() => {
	sessionStorage.clear();
	auth.isLoading = false;
	auth.isAuthenticated = false;
	auth.activeNavigator = undefined;
	auth.error = undefined;
	auth.signinRedirect.mockClear();
});

describe('a user working in a session handed over from a retailer', () => {
	it('is at work without logging in, having been let in by the ticket', () => {
		beginHandoffSession(REDEEMED);

		renderGuarded();

		expect(screen.queryByText('the application')).not.toBeNull();
		expect(auth.signinRedirect).not.toHaveBeenCalled();
	});

	/** The login is no help to them: the user of a handed-over session has no account of their own to log in with. */
	it('is told the session is over rather than sent to a login', () => {
		endHandoffSession();

		renderGuarded();

		expect(screen.queryByText('handoff.sessionEnded')).not.toBeNull();
		expect(screen.queryByText('the application')).toBeNull();
		expect(auth.signinRedirect).not.toHaveBeenCalled();
	});

	/**
	 * A session ends underneath the user, on a renewal the API refuses, rather than on anything they did. They are told
	 * where they stand there and then, on the page they are on.
	 */
	it('is told the moment the session ends under them', () => {
		beginHandoffSession(REDEEMED);
		renderGuarded();

		act(() => {
			endHandoffSession();
		});

		expect(screen.queryByText('handoff.sessionEnded')).not.toBeNull();
		expect(screen.queryByText('the application')).toBeNull();
		expect(auth.signinRedirect).not.toHaveBeenCalled();
	});
});

describe('a user who came on their own', () => {
	it('is sent to the login', () => {
		renderGuarded();

		expect(auth.signinRedirect).toHaveBeenCalledOnce();
		expect(screen.queryByText('the application')).toBeNull();
	});

	it('is at work once logged in', () => {
		auth.isAuthenticated = true;

		renderGuarded();

		expect(screen.queryByText('the application')).not.toBeNull();
		expect(auth.signinRedirect).not.toHaveBeenCalled();
	});

	it('is told when the login itself failed', () => {
		auth.error = new Error('the authorization server said no');

		renderGuarded();

		expect(screen.queryByText(/auth.signInError/)).not.toBeNull();
		expect(auth.signinRedirect).not.toHaveBeenCalled();
	});
});
