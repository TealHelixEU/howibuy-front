import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { useAuth } from 'react-oidc-context';
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
});
