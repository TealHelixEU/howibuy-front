import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ProgressBar } from '@/components/ProgressBar';
import { RichText } from '@/components/RichText';
import { estimatedMinutes } from '../estimate';
import type { CategoryOverview } from '../sfc';
import { DimensionIcon } from './DimensionIcon';

interface CategoryCardProps {
	overview: CategoryOverview;
}

/**
 * One category on the compass: what it covers, how far the user has got with it, and the way in. The invitation reads
 * differently depending on whether there is anything to start, carry on with, or look back over.
 */
export function CategoryCard({ overview }: CategoryCardProps) {
	const { t } = useTranslation();
	const { category, progress, estimatedSeconds } = overview;

	return (
		<Link
			to={`/sfc/${category.id}`}
			className="card h-full border border-base-300 bg-base-100 transition-colors hover:border-primary"
		>
			<div className="card-body gap-3">
				<h3 className="card-title gap-2 text-lg">
					<DimensionIcon dimension={category.dimension} className="shrink-0 text-primary" />
					{category.name}
				</h3>

				<RichText html={category.description} className="grow text-sm opacity-80" />

				<ProgressBar percentage={progress.percentage} label={category.name} className="w-full" />
				<div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
					<span>{t('sfc.progress.category', { answered: progress.answered, total: progress.total })}</span>
					<span className="opacity-70">
						{t('sfc.estimate.category', { minutes: estimatedMinutes(estimatedSeconds) })}
					</span>
				</div>

				<span className="btn self-start btn-primary btn-sm">{t(invitationKey(progress))}</span>
			</div>
		</Link>
	);
}

function invitationKey({ answered, total }: { answered: number; total: number }): string {
	if (answered === 0) {
		return 'sfc.category.start';
	}
	return answered === total ? 'sfc.category.review' : 'sfc.category.continue';
}
