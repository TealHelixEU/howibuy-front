import { useState } from 'react';
import { fireEvent, isInaccessible, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Explanation } from './Explanation';

const SAID = 'You earn 10 XP for each product you buy that scores high for sustainability.';

/** An explanation in a card, as a screen holds one: the screen decides whether it is open. */
function Explained() {
	const [open, setOpen] = useState(false);
	return (
		<div className="card relative">
			<Explanation label="How XP works" open={open} onOpenChange={setOpen}>
				<p>{SAID}</p>
			</Explanation>
		</div>
	);
}

function openExplanation() {
	render(<Explained />);
	const button = screen.getByRole('button', { name: 'How XP works' });
	fireEvent.click(button);
	return button;
}

describe('an explanation', () => {
	it('stays out of sight until asked for, then shows what it explains and says it is open', () => {
		render(<Explained />);
		const button = screen.getByRole('button', { name: 'How XP works' });

		expect(button.getAttribute('aria-expanded')).toBe('false');
		expect(isInaccessible(screen.getByText(SAID))).toBe(true);

		fireEvent.click(button);

		expect(button.getAttribute('aria-expanded')).toBe('true');
		expect(isInaccessible(screen.getByText(SAID))).toBe(false);
		expect(document.getElementById(button.getAttribute('aria-controls') ?? '')?.textContent).toBe(SAID);
	});

	it('dims the rest of the page while it is open', () => {
		openExplanation();

		expect(screen.queryByTestId('dimmed-page')).not.toBeNull();
	});

	it('closes on Esc', () => {
		const button = openExplanation();

		fireEvent.keyDown(document, { key: 'Escape' });

		expect(button.getAttribute('aria-expanded')).toBe('false');
		expect(isInaccessible(screen.getByText(SAID))).toBe(true);
		expect(screen.queryByTestId('dimmed-page')).toBeNull();
	});

	it('closes on a click on the dimmed page', () => {
		const button = openExplanation();

		fireEvent.click(screen.getByTestId('dimmed-page'));

		expect(button.getAttribute('aria-expanded')).toBe('false');
	});

	it('closes on its button', () => {
		const button = openExplanation();

		fireEvent.click(button);

		expect(button.getAttribute('aria-expanded')).toBe('false');
	});

	it('leaves other keys alone', () => {
		const button = openExplanation();

		fireEvent.keyDown(document, { key: 'Enter' });

		expect(button.getAttribute('aria-expanded')).toBe('true');
	});
});
