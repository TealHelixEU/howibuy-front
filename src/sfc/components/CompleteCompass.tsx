import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useCompass } from '@/sfc/compassContext';
import { completeAttempt } from '@/sfc/sfc';

/**
 * The deliberate act the compass exists for: committing the answers as the record. Offered only once every question is
 * answered and while the attempt is still open, and asked about before it happens, since a committed attempt cannot be
 * changed afterwards.
 */
export function CompleteCompass() {
	const { t } = useTranslation();
	const { overview, refresh } = useCompass();
	const [asking, setAsking] = useState(false);
	const [committing, setCommitting] = useState(false);
	const [failure, setFailure] = useState<string | null>(null);

	const { answered, total } = overview.overallProgress;
	const ready = overview.attemptStatus === 'IN_PROGRESS' && answered === total;

	if (!ready && failure === null) {
		return null;
	}

	async function complete() {
		setCommitting(true);
		setFailure(null);
		try {
			await completeAttempt();
			setAsking(false);
		} catch (refusal) {
			setAsking(false);
			setFailure(stillUnanswered(refusal) ? 'sfc.complete.incomplete' : 'sfc.complete.failed');
		} finally {
			setCommitting(false);
		}
		await refresh();
	}

	return (
		<>
			{ready && (
				<div className="alert flex-wrap alert-success">
					<span>{t('sfc.complete.ready')}</span>
					<button type="button" className="btn btn-primary btn-sm" onClick={() => setAsking(true)}>
						{t('sfc.complete.action')}
					</button>
				</div>
			)}

			{failure !== null && (
				<div className="alert alert-error">
					<span>{t(failure)}</span>
				</div>
			)}

			{asking && (
				<ConfirmDialog
					title={t('sfc.complete.confirmTitle')}
					body={t('sfc.complete.confirmBody')}
					confirmLabel={t('sfc.complete.confirm')}
					cancelLabel={t('sfc.cancel')}
					busy={committing}
					onConfirm={() => void complete()}
					onCancel={() => setAsking(false)}
				/>
			)}
		</>
	);
}

/** Whether the server refused because it found questions the compass thought were answered. */
function stillUnanswered(refusal: unknown): boolean {
	return refusal instanceof ApiError && refusal.status === 422;
}
