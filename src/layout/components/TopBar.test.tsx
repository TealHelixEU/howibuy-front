import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { useAuth } from 'react-oidc-context';
import { beginHandoffSession } from '@/handoff/handoffSession';
import { navItems } from '../navItems';
import { TopBar } from './TopBar';

vi.mock('react-oidc-context', () => ({ useAuth: vi.fn() }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const useAuthMock = vi.mocked(useAuth);

function renderTopBarAt(path: string, auth: unknown = { user: undefined }) {
	useAuthMock.mockReturnValue(auth as never);

	return render(
		<RouterProvider
			router={createMemoryRouter([{ path: '*', element: <TopBar /> }], { initialEntries: [path] })}
		/>,
	);
}

beforeEach(() => {
	sessionStorage.clear();
});

describe('TopBar', () => {
	it('renders a link for every nav item', () => {
		renderTopBarAt('/');

		for (const item of navItems) {
			expect(screen.queryByRole('link', { name: item.labelKey })).not.toBeNull();
		}
	});

	it('marks only the current route as active', () => {
		renderTopBarAt('/sfc');

		expect(screen.getByRole('link', { name: 'nav.sfc' }).className).toContain('text-brand-teal');
		expect(screen.getByRole('link', { name: 'nav.dashboard' }).className).toContain('text-brand-blue');
	});

	it('shows the signed-in email and signs out on request', () => {
		const signoutRedirect = vi.fn();
		renderTopBarAt('/', { user: { profile: { email: 'bob@krusty-krab.com' } }, signoutRedirect });

		expect(screen.queryByText('bob@krusty-krab.com')).not.toBeNull();

		fireEvent.click(screen.getByRole('button', { name: 'auth.logout' }));

		expect(signoutRedirect).toHaveBeenCalled();
	});

	it('falls back to the profile name when no email is present', () => {
		renderTopBarAt('/', { user: { profile: { name: 'Bob' } } });

		expect(screen.queryByText('Bob')).not.toBeNull();
	});

	/**
	 * A handed-over session belongs to no account here: there is nothing to sign out of, and signing out would send the user
	 * to an authorization server that knows nothing of the session they are in. Whatever an earlier login of this browser
	 * left behind is not theirs to be shown either. Getting about the application is unaffected.
	 */
	it('offers no account of their own to a user in a handed-over session', () => {
		beginHandoffSession({ accessToken: 'session-token', expiresInSeconds: 900 });

		renderTopBarAt('/sfc', { user: { profile: { email: 'bob@krusty-krab.com' } } });

		expect(screen.queryByRole('button', { name: 'auth.logout' })).toBeNull();
		expect(screen.queryByText('bob@krusty-krab.com')).toBeNull();
		expect(screen.queryByRole('link', { name: 'nav.sfc' })).not.toBeNull();
	});
});
