import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useTranslation } from 'react-i18next';
import { HandoffSessionEnded } from '@/handoff/components/HandoffSessionEnded';
import { useHandoffSessionState } from '@/handoff/useHandoffSessionState';

interface RequireAuthProps {
	children: ReactNode;
}

/**
 * Let through whoever the tab's session belongs to. There are two ways to have one: a login of the user's own, and a
 * session a retailer handed over. The one the tab is in decides what an absent session means — a login to be started, or
 * a session that is over and cannot be started again from here.
 */
export function RequireAuth({ children }: RequireAuthProps) {
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

	if (handoffSession === 'live') {
		return <>{children}</>;
	}

	// Every other handed-over session is one that cannot be worked in, and the user of one has no login of their own to be
	// sent to instead. Which way it ended is theirs to be told, so it is passed on rather than settled here.
	if (handoffSession !== 'none') {
		return (
			<Notice>
				<HandoffSessionEnded end={handoffSession} />
			</Notice>
		);
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

interface NoticeProps {
	children: ReactNode;
}

/** What the page holds instead of the application, while there is a reason it holds nothing else. */
function Notice({ children }: NoticeProps) {
	return <div className="flex h-full items-center justify-center p-8">{children}</div>;
}
