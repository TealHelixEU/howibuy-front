import { describe, expect, it } from 'vitest';
import { estimatedMinutes } from './estimate';

describe('the time the compass says it takes', () => {
	it('is the estimate in whole minutes', () => {
		expect(estimatedMinutes(43 * 20)).toBe(14);
		expect(estimatedMinutes(3 * 20)).toBe(1);
	});

	it('never rounds down to no time at all', () => {
		expect(estimatedMinutes(20)).toBe(1);
	});
});
