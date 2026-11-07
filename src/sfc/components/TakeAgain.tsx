import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { startNewAttempt, type CompassOverview } from '@/sfc/sfc';

interface TakeAgainProps {
	overview: CompassOverview;
	onStarted: () => Promise<void>;
}

/**
 * The way back to a blank compass for a user whose answers have stood long enough, and — until they have — word of when
 * that will be. Asked about first: a fresh attempt starts empty, and no screen shows the completed one again.
 */
export function TakeAgain({ overview, onStarted }: TakeAgainProps) {
	const { t } = useTranslation();
	const [asking, setAsking] = useState(false);
	const [starting, setStarting] = useState(false);
	const [failure, setFailure] = useState<string | null>(null);

	if (overview.attemptStatus !== 'COMPLETED') {
		return null;
	}

	if (!overview.eligibleToStartNewAttempt) {
		return (
			<div className="alert alert-info">
				<span>{t('sfc.again.notYet', { when: readable(overview.eligibleAt) })}</span>
			</div>
		);
	}

	async function start() {
		setStarting(true);
		setFailure(null);
		try {
			await startNewAttempt();
			setAsking(false);
		} catch {
			setAsking(false);
			setFailure('sfc.again.failed');
		} finally {
			setStarting(false);
		}
		await onStarted();
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<span className="text-sm opacity-70">{t('sfc.again.completed')}</span>
				<button type="button" className="btn btn-outline btn-sm" onClick={() => setAsking(true)}>
					{t('sfc.again.action')}
				</button>
			</div>

			{failure !== null && (
				<div className="alert alert-error">
					<span>{t(failure)}</span>
				</div>
			)}

			{asking && (
				<ConfirmDialog
					title={t('sfc.again.confirmTitle')}
					body={t('sfc.again.confirmBody')}
					confirmLabel={t('sfc.again.confirm')}
					cancelLabel={t('sfc.cancel')}
					busy={starting}
					onConfirm={() => void start()}
					onCancel={() => setAsking(false)}
				/>
			)}
		</div>
	);
}

/**
 * The moment the completed answers stop having to stand, as a person reads it. The API states it without a zone, so it is
 * taken as a time where the user is.
 */
function readable(eligibleAt: string | null): string {
	if (eligibleAt === null) {
		return '';
	}
	const moment = new Date(eligibleAt);
	return Number.isNaN(moment.getTime()) ? eligibleAt : moment.toLocaleString();
}
