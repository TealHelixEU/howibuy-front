import { useId } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FaRegCompass } from 'react-icons/fa6';
import { ProgressBar } from '@/components/ProgressBar';
import { estimatedMinutes } from '@/sfc/estimate';
import type { CompassOverview } from '@/sfc/sfc';

interface CompassInvitationProps {
	overview: CompassOverview;
}

/**
 * The way to the compass, shown until the user has completed an attempt. Until then their baskets are matched against an
 * expert weighting, or, while they retake it, against the priorities they gave last time. A user who has not started is
 * told how long it takes; one who has, how far they have got.
 */
export function CompassInvitation({ overview }: CompassInvitationProps) {
	const { t } = useTranslation();
	const titleId = useId();

	if (overview.attemptStatus === 'COMPLETED') {
		return null;
	}

	const started = overview.attemptStatus === 'IN_PROGRESS';
	const wording = wordingOf(overview);
	const { answered, total, percentage } = overview.overallProgress;

	return (
		<section
			aria-labelledby={titleId}
			className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-box border border-primary bg-base-100 px-6 py-5"
		>
			<FaRegCompass aria-hidden="true" className="flex-none text-[40px] text-primary" />

			<div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
				<h2 id={titleId} className="m-0 text-[22px] leading-[1.1]">
					{t(wording.title)}
				</h2>
				<p>{t(wording.text)}</p>
				{started && (
					<div className="flex max-w-[420px] flex-col gap-1">
						<ProgressBar
							percentage={percentage}
							label={t('sfc.progress.overallLabel')}
							className="w-full"
						/>
						<span className="text-sm">{t('sfc.progress.overall', { answered, total, percentage })}</span>
					</div>
				)}
			</div>

			<div className="flex flex-none flex-col items-start gap-1">
				<Link to="/sfc" className="btn btn-primary">
					{t(started ? 'dashboard.invitation.continue' : 'dashboard.invitation.start.action')}
				</Link>
				{!started && (
					<span className="text-sm opacity-70">
						{t('sfc.estimate.total', { minutes: estimatedMinutes(overview.overallEstimatedSeconds) })}
					</span>
				)}
			</div>
		</section>
	);
}

/** What the invitation says: a first attempt and a retake in progress are matched against different priorities. */
function wordingOf({ attemptStatus, hasCompletedAttempt }: CompassOverview): { title: string; text: string } {
	if (attemptStatus === null) {
		return { title: 'dashboard.invitation.start.title', text: 'dashboard.invitation.start.text' };
	}
	return hasCompletedAttempt
		? { title: 'dashboard.invitation.retake.title', text: 'dashboard.invitation.retake.text' }
		: { title: 'dashboard.invitation.firstAttempt.title', text: 'dashboard.invitation.firstAttempt.text' };
}
