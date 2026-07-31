import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageTitleBand } from './PageTitleBand';

describe('PageTitleBand', () => {
	it('renders the eyebrow and the page title', () => {
		render(<PageTitleBand eyebrow="HowiBuy" title="Shop Floor Control" />);

		expect(screen.queryByText('HowiBuy')).not.toBeNull();
		expect(screen.queryByRole('heading', { level: 1, name: 'Shop Floor Control' })).not.toBeNull();
	});

	it('keeps the decorative pattern out of the accessibility tree', () => {
		const { container } = render(<PageTitleBand eyebrow="HowiBuy" title="SFC" />);

		expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
	});
});
