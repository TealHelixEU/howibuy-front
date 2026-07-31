import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Outlet, RouterProvider, createMemoryRouter, type RouteObject } from 'react-router';
import { useRouteTitleKey } from './routeTitle';

function TitleKeyProbe() {
	return <span>{useRouteTitleKey() ?? 'no-title-key'}</span>;
}

function ProbeWithChildren() {
	return (
		<>
			<TitleKeyProbe />
			<Outlet />
		</>
	);
}

const routes: RouteObject[] = [
	{
		path: '/',
		element: <ProbeWithChildren />,
		handle: { titleKey: 'section.title' },
		children: [
			{ index: true, element: null },
			{ path: 'deep', element: null, handle: { titleKey: 'deep.title' } },
			{ path: 'plain', element: null },
		],
	},
];

function renderAt(path: string, routeObjects: RouteObject[] = routes) {
	return render(<RouterProvider router={createMemoryRouter(routeObjects, { initialEntries: [path] })} />);
}

describe('useRouteTitleKey', () => {
	it('prefers the deepest route that declares a title key', () => {
		renderAt('/deep');

		expect(screen.queryByText('deep.title')).not.toBeNull();
	});

	it('falls back to an ancestor when the matched route declares none', () => {
		renderAt('/plain');

		expect(screen.queryByText('section.title')).not.toBeNull();
	});

	it('returns nothing when no matched route declares a title key', () => {
		renderAt('/', [{ path: '/', element: <TitleKeyProbe /> }]);

		expect(screen.queryByText('no-title-key')).not.toBeNull();
	});
});
