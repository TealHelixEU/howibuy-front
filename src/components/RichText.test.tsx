import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RichText } from './RichText';

describe('rich text from the API', () => {
	it('renders the formatting the content carries rather than showing it as characters', () => {
		const { container } = render(<RichText html="<strong>Water use</strong>: the water a food needs." />);

		expect(container.querySelector('strong')?.textContent).toBe('Water use');
		expect(screen.queryByText('<strong>', { exact: false })).toBeNull();
	});

	it('renders plain content as it stands', () => {
		render(<RichText html="Land use: the land a food needs." />);

		expect(screen.queryByText('Land use: the land a food needs.')).not.toBeNull();
	});
});
