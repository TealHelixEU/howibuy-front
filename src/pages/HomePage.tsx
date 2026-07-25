import { useAtomValue } from 'jotai';
import { useAuth } from 'react-oidc-context';
import { useTranslation } from 'react-i18next';
import { apiServerHostAtom } from '@/config/atoms';

export function HomePage() {
	const auth = useAuth();
	const { t } = useTranslation();
	const apiServerHost = useAtomValue(apiServerHostAtom);
	const profile = auth.user?.profile;
	const name = profile?.name ?? profile?.email ?? '';

	return (
		<div>
			<h1>{t('home.welcome', { name })}</h1>

			<div className="card mt-4 max-w-xl border border-base-300 bg-base-100">
				<div className="card-body gap-3">
					<div>
						<div className="text-sm opacity-60">{t('home.signedInAs')}</div>
						<div className="font-mono">{profile?.email ?? '—'}</div>
					</div>
					<div>
						<div className="text-sm opacity-60">{t('home.apiServer')}</div>
						<div className="font-mono">{apiServerHost ?? '—'}</div>
					</div>
				</div>
			</div>
		</div>
	);
}
