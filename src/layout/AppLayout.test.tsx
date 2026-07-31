import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryRouter, type RouteObject } from 'react-router';
import { AppLayout } from './AppLayout';

vi.mock('react-oidc-context', () => ({ useAuth: () => ({ user: undefined }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const routes: RouteObject[] = [
	{
		path: '/',
		element: <AppLayout />,
		children: [{ index: true, element: <p>page body</p>, handle: { titleKey: 'sfc.title' } }],
	},
];

function renderLayout(routeObjects: RouteObject[] = routes) {
	return render(<RouterProvider router={createMemoryRouter(routeObjects, { initialEntries: ['/'] })} />);
}

describe('AppLayout', () => {
	it('stacks the top bar, title band, page content and both footer strips', () => {
		const { container } = renderLayout();

		expect(screen.queryByRole('link', { name: 'layout.logoAlt' })).not.toBeNull();
		expect(screen.queryByRole('heading', { level: 1, name: 'sfc.title' })).not.toBeNull();
		expect(screen.queryByText('page body')).not.toBeNull();
		expect(screen.queryByText('layout.funding.title')).not.toBeNull();
		// An empty strip has no content to find it by, so its background is the only handle.
		expect(container.querySelector('.bg-brand-teal-muted')).not.toBeNull();
	});

	it('titles the band with the app name as its eyebrow', () => {
		renderLayout();

		expect(screen.queryByText('app.title')).not.toBeNull();
	});

	it('omits the title band for routes that declare no title', () => {
		renderLayout([{ path: '/', element: <AppLayout />, children: [{ index: true, element: <p>page body</p> }] }]);

		expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
		expect(screen.queryByText('page body')).not.toBeNull();
	});

	it('no longer renders a drawer', () => {
		const { container } = renderLayout();

		expect(container.querySelector('.drawer')).toBeNull();
		expect(container.querySelector('#app-drawer')).toBeNull();
	});
});
