import { Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FundingStrip } from './components/FundingStrip';
import { PageTitleBand } from './components/PageTitleBand';
import { SiteInfoStrip } from './components/SiteInfoStrip';
import { TopBar } from './components/TopBar';
import { useRouteTitleKey } from './routeTitle';

export function AppLayout() {
	const { t } = useTranslation();
	const titleKey = useRouteTitleKey();

	return (
		<div className="flex min-h-dvh flex-col">
			<TopBar />

			{titleKey !== undefined && <PageTitleBand eyebrow={t('app.title')} title={t(titleKey)} />}

			<main className="site-column flex-1 py-6">
				<Outlet />
			</main>

			<footer>
				<FundingStrip />
				<SiteInfoStrip />
			</footer>
		</div>
	);
}
