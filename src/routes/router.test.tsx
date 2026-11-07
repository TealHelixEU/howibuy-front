import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { routes } from './router';

vi.mock('react-oidc-context', () => ({
	useAuth: () => ({ isAuthenticated: true, user: undefined }),
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
// The compass asks the API for its overview as soon as it renders; leaving that unanswered keeps this about the routes.
vi.mock('@/sfc/sfc', () => ({ fetchOverview: () => new Promise(() => {}) }));

function renderAt(path: string) {
	const router = createMemoryRouter(routes, { initialEntries: [path] });
	render(<RouterProvider router={router} />);
	return router;
}

describe('router', () => {
	it('lands on the dashboard at /', async () => {
		const router = renderAt('/');

		expect(await screen.findByText('dashboard.title')).not.toBeNull();
		expect(router.state.location.pathname).toBe('/dashboard');
	});

	it('renders the SFC page at /sfc', () => {
		renderAt('/sfc');

		expect(screen.queryByText('sfc.title')).not.toBeNull();
	});

	it('renders the dashboard page at /dashboard', () => {
		renderAt('/dashboard');

		expect(screen.queryByText('dashboard.title')).not.toBeNull();
	});

	it('offers the dashboard first, then the compass', () => {
		renderAt('/dashboard');

		const links = within(screen.getByRole('navigation')).getAllByRole('link');

		expect(links.map((link) => link.textContent)).toEqual(['nav.dashboard', 'nav.sfc']);
	});
});
