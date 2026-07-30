import { useTranslation } from 'react-i18next';

export function DashboardPage() {
	const { t } = useTranslation();

	return (
		<div>
			<h1>{t('dashboard.title')}</h1>
		</div>
	);
}
