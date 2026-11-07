import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { NotFoundPage } from './NotFoundPage';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('NotFoundPage', () => {
	it('leads back to the dashboard', () => {
		render(
			<RouterProvider
				router={createMemoryRouter([{ path: '*', element: <NotFoundPage /> }], {
					initialEntries: ['/nowhere'],
				})}
			/>,
		);

		const way = screen.getByRole('link', { name: 'notFound.backToDashboard' });
		expect(way.getAttribute('href')).toBe('/dashboard');
	});
});
