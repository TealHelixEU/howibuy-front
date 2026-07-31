import { useTranslation } from 'react-i18next';
import euFlag from '@/assets/images/eu-flag.svg';

/**
 * Horizon Europe funding acknowledgement. The flag and statement show at every width;
 * the grant disclaimer is too long to be useful on a phone, so it starts at md.
 */
export function FundingStrip() {
	const { t } = useTranslation();

	return (
		<div className="bg-brand-green-pale py-5 text-base-content">
			<div className="site-column">
				<div className="flex items-center gap-4">
					<img
						src={euFlag}
						alt={t('layout.funding.flagAlt')}
						width={100}
						height={67}
						className="w-[100px] shrink-0 border border-white"
					/>
					<p className="max-w-[14ch] text-[20px] leading-tight font-semibold">{t('layout.funding.title')}</p>
				</div>
				<p className="mt-4 hidden text-[17px] md:block">{t('layout.funding.disclaimer')}</p>
			</div>
		</div>
	);
}
