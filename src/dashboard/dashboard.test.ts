import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureApiServerHost } from '@/api/client';
import { currentMonth, fetchDashboard } from './dashboard';

vi.mock('@/auth/session', () => ({ getAccessToken: () => Promise.resolve('a-token-the-login-left-behind') }));
vi.mock('@/i18n', () => ({ currentLanguage: () => 'el' }));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
	configureApiServerHost('https://api.test');
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('the month the user calls this month', () => {
	it('is the year and the month of the local date, the month written with two digits', () => {
		expect(currentMonth(new Date(2026, 2, 1, 0, 0))).toBe('2026-03');
	});

	it('stays in its year in December, to the last minute of it', () => {
		expect(currentMonth(new Date(2026, 11, 31, 23, 59))).toBe('2026-12');
	});
});

describe('reading the dashboard', () => {
	it('asks for the month given, in the language the app is showing, as the signed-in user', async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ xpTotal: 1440 }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}),
		);

		const dashboard = await fetchDashboard('2026-11');

		const [url, init] = fetchMock.mock.calls[0] ?? [];
		expect(url).toBe('https://api.test/dashboard?month=2026-11&lang=el');
		expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer a-token-the-login-left-behind');
		expect(dashboard.xpTotal).toBe(1440);
	});
});
