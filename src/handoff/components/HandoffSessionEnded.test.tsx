import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HandoffSessionEnd } from '../handoffSession';
import { HandoffSessionEnded } from './HandoffSessionEnded';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('what a user is left with when a handed-over session cannot be worked in', () => {
	/**
	 * Each way it can end reads differently, because the three are not the same news: a link already spent, a service that
	 * could not be reached, and a session that ran its course.
	 */
	it.each<[HandoffSessionEnd, string]>([
		['linkRefused', 'handoff.linkRefused'],
		['serviceUnreachable', 'handoff.serviceUnreachable'],
		['sessionOver', 'handoff.sessionOver'],
	])('says what happened, %s, and the one way on from it', (end, messageKey) => {
		render(<HandoffSessionEnded end={end} />);

		expect(screen.queryByText(messageKey)).not.toBeNull();
		expect(screen.queryByText('handoff.returnToShop')).not.toBeNull();
	});
});
