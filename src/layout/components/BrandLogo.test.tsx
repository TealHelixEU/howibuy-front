import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { BrandLogo } from './BrandLogo';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

function renderBrandLogo() {
	return render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <BrandLogo /> }])} />);
}

describe('BrandLogo', () => {
	it('shows the three logo parts in brand order', () => {
		const { container } = renderBrandLogo();

		// Identified by intrinsic width: the parts scale from a shared 136.57 height, so
		// 106 / 42 / 142 pins HowiBuy wordmark, mark, TealHelix wordmark. Matching on the
		// src is not an option — Vite inlines the two small SVGs as data URIs.
		const shapes = [...container.querySelectorAll('img')].map((img) => img.getAttribute('width'));

		expect(shapes).toEqual(['106', '42', '142']);
	});

	it('keeps the mark at every width and adds the wordmarks at md and xl', () => {
		const { container } = renderBrandLogo();

		const [hib, mark, th] = [...container.querySelectorAll('img')];

		expect(mark.className).not.toContain('hidden');
		expect(hib.className).toContain('hidden');
		expect(hib.className).toContain('md:block');
		expect(th.className).toContain('hidden');
		expect(th.className).toContain('xl:block');
	});

	it('links to the dashboard under a single accessible name, leaving the parts decorative', () => {
		const { container } = renderBrandLogo();

		expect(screen.getByRole('link', { name: 'layout.logoAlt' }).getAttribute('href')).toBe('/dashboard');
		for (const img of container.querySelectorAll('img')) {
			expect(img.getAttribute('alt')).toBe('');
		}
	});
});
