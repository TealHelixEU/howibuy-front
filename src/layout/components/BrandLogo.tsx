import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import hibWordmark from '@/assets/images/hib.svg';
import brandMark from '@/assets/images/logo.svg';
import tealHelixWordmark from '@/assets/images/th.svg';

/**
 * The brand lockup, revealed in three parts: the mark alone on phones, the HowiBuy
 * wordmark from md, and the TealHelix wordmark from xl. Each part carries its own
 * spacing, so they sit flush. The link holds the accessible name and the parts stay
 * decorative, so the name is announced once rather than three times.
 */
export function BrandLogo() {
	const { t } = useTranslation();

	return (
		<Link to="/dashboard" aria-label={t('layout.logoAlt')} className="flex shrink-0 items-center">
			<img src={hibWordmark} alt="" width={106} height={44} className="hidden h-11 w-auto md:block" />
			<img src={brandMark} alt="" width={42} height={44} className="h-11 w-auto" />
			<img src={tealHelixWordmark} alt="" width={142} height={44} className="hidden h-11 w-auto xl:block" />
		</Link>
	);
}
