import { useTranslation } from 'react-i18next';
import euFlag from '@/assets/images/eu-flag.svg';

/**
 * Horizon Europe funding acknowledgement. The flag and statement show at every width;
 * the grant disclaimer is too long to be useful on a phone, so it starts at md.
 *
 * Below md the flag, the statement and the padding all step down: at full size the strip
 * claims over a hundred pixels of a phone screen, which is a lot for an acknowledgement.
 */
export function FundingStrip() {
	const { t } = useTranslation();

	return (
		<div className="bg-brand-green-pale py-3 text-base-content md:py-5">
			<div className="site-column">
				<div className="flex items-center gap-3 md:gap-4">
					<img
						src={euFlag}
						alt={t('layout.funding.flagAlt')}
						width={100}
						height={67}
						className="w-16 shrink-0 border border-white md:w-[100px]"
					/>
					<p className="text-[17px] leading-tight font-semibold md:text-[20px]">
						{t('layout.funding.title')}
					</p>
				</div>
				<p className="mt-4 hidden text-[17px] md:block">{t('layout.funding.disclaimer')}</p>
			</div>
		</div>
	);
}
