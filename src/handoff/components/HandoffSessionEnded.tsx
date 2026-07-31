import { useTranslation } from 'react-i18next';
import type { HandoffSessionEnd } from '../handoffSession';

const MESSAGE_KEY: Record<HandoffSessionEnd, string> = {
	linkRefused: 'handoff.linkRefused',
	serviceUnreachable: 'handoff.serviceUnreachable',
	sessionOver: 'handoff.sessionOver',
};

/**
 * What became of the session the retailer opened, and the one way on from it. Every way it can end leads back to the
 * retailer, there being no login of the user's own here to fall back on, so what changes between them is what they are
 * told happened rather than what they are asked to do.
 */
export function HandoffSessionEnded({ end }: { end: HandoffSessionEnd }) {
	const { t } = useTranslation();

	return (
		<div className="card max-w-lg border border-base-300 bg-base-100">
			<div className="card-body gap-3 text-center">
				<h2>{t(MESSAGE_KEY[end])}</h2>
				<p>{t('handoff.returnToShop')}</p>
			</div>
		</div>
	);
}
