import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from './ProgressBar';

describe('a progress bar', () => {
	it('shows how far along it is, under the name it is given', () => {
		render(<ProgressBar percentage={28} label="12 of 43 answered" />);

		const bar = screen.getByRole('progressbar', { name: '12 of 43 answered' });
		expect((bar as HTMLProgressElement).value).toBe(28);
		expect((bar as HTMLProgressElement).max).toBe(100);
	});

	it('shows nothing done as nothing done', () => {
		render(<ProgressBar percentage={0} label="none of 11 answered" />);

		expect((screen.getByRole('progressbar') as HTMLProgressElement).value).toBe(0);
	});
});
