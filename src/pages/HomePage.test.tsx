import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { useAuth } from 'react-oidc-context';
import { appConfigAtom } from '@/config/atoms';
import { HomePage } from './HomePage';

vi.mock('react-oidc-context', () => ({ useAuth: vi.fn() }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const useAuthMock = vi.mocked(useAuth);

function renderHomePage() {
	const store = createStore();
	store.set(appConfigAtom, {
		authServerHost: 'http://localhost:8280/realms/tealhelix',
		apiServerHost: 'http://localhost:8180/api/howibuy/v1',
		oidcClientId: 'howibuy',
	});

	return render(
		<JotaiProvider store={store}>
			<HomePage />
		</JotaiProvider>,
	);
}

describe('HomePage', () => {
	it('greets the signed-in user and shows the API server it talks to', () => {
		useAuthMock.mockReturnValue({
			user: { profile: { name: 'Bob', email: 'bob@krusty-krab.com' } },
		} as never);

		renderHomePage();

		expect(screen.queryByText('home.welcome')).not.toBeNull();
		expect(screen.queryByText('bob@krusty-krab.com')).not.toBeNull();
		expect(screen.queryByText('http://localhost:8180/api/howibuy/v1')).not.toBeNull();
	});

	it('renders without a profile', () => {
		useAuthMock.mockReturnValue({ user: undefined } as never);

		renderHomePage();

		expect(screen.queryByText('home.welcome')).not.toBeNull();
		expect(screen.queryByText('—')).not.toBeNull();
	});
});
