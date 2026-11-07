import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoadFailure } from './LoadFailure';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('a load failure', () => {
	it('says what could not be loaded, and tries again on request', () => {
		const onRetry = vi.fn(() => Promise.resolve());
		render(<LoadFailure message="The dashboard could not be loaded just now" onRetry={onRetry} />);

		expect(screen.queryByText('The dashboard could not be loaded just now')).not.toBeNull();

		fireEvent.click(screen.getByRole('button', { name: 'common.retry' }));

		expect(onRetry).toHaveBeenCalledOnce();
	});

	it('cannot be retried again while a retry is in flight', async () => {
		let settle!: () => void;
		const onRetry = () =>
			new Promise<void>((resolve) => {
				settle = resolve;
			});
		render(<LoadFailure message="The compass could not be loaded just now" onRetry={onRetry} />);
		const retry = screen.getByRole('button', { name: 'common.retry' }) as HTMLButtonElement;

		fireEvent.click(retry);

		expect(retry.disabled).toBe(true);

		await act(async () => {
			settle();
		});

		expect(retry.disabled).toBe(false);
	});
});
