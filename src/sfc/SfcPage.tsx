import { useTranslation } from 'react-i18next';

export function SfcPage() {
	const { t } = useTranslation();

	return (
		<div>
			<h1>{t('sfc.title')}</h1>
		</div>
	);
}
