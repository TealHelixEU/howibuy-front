import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { routes } from './router';

vi.mock('react-oidc-context', () => ({
	useAuth: () => ({ isAuthenticated: true, user: undefined }),
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

function renderAt(path: string) {
	return render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
}

describe('router', () => {
	it('renders the SFC page at /sfc', () => {
		renderAt('/sfc');

		expect(screen.queryByText('sfc.title')).not.toBeNull();
	});

	it('renders the dashboard page at /dashboard', () => {
		renderAt('/dashboard');

		expect(screen.queryByText('dashboard.title')).not.toBeNull();
	});
});
