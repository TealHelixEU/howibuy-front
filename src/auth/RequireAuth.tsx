import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useTranslation } from 'react-i18next';
import { useHandoffSessionState } from '@/handoff/useHandoffSessionState';

/**
 * Let through whoever the tab's session belongs to. There are two ways to have one: a login of the user's own, and a
 * session a retailer handed over. The one the tab is in decides what an absent session means — a login to be started, or
 * a session that is over and cannot be started again from here.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
	const handoffSession = useHandoffSessionState();
	const auth = useAuth();
	const { t } = useTranslation();

	useEffect(() => {
		if (
			handoffSession === 'none' &&
			!auth.isLoading &&
			!auth.isAuthenticated &&
			!auth.activeNavigator &&
			!auth.error
		) {
			void auth.signinRedirect();
		}
	}, [auth, handoffSession]);

	// The user of a handed-over session has no login of their own, so there is nowhere to send them but back to the retailer.
	if (handoffSession === 'ended') {
		return (
			<Notice>
				<div className="alert max-w-md alert-warning">
					<span>{t('handoff.sessionEnded')}</span>
				</div>
			</Notice>
		);
	}

	if (handoffSession === 'live') {
		return <>{children}</>;
	}

	if (auth.error) {
		return (
			<Notice>
				<div className="alert max-w-md alert-error">
					<span>
						{t('auth.signInError')}: {auth.error.message}
					</span>
				</div>
			</Notice>
		);
	}

	if (!auth.isAuthenticated) {
		return (
			<Notice>
				<span className="loading loading-lg loading-spinner" aria-label={t('auth.signingIn')} />
			</Notice>
		);
	}

	return <>{children}</>;
}

/** What the page holds instead of the application, while there is a reason it holds nothing else. */
function Notice({ children }: { children: ReactNode }) {
	return <div className="flex h-full items-center justify-center p-8">{children}</div>;
}
