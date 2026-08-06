import { useTranslation } from 'react-i18next';
import { ProgressBar } from '@/components/ProgressBar';
import { CategoryCard } from './components/CategoryCard';
import { useCompass } from './compassContext';
import { inPresentationOrder } from './dimensions';
import { estimatedMinutes } from './estimate';

/**
 * The compass as a whole: how far the user has got, how long the whole thing takes, and the categories it is made of, to
 * be worked through in whatever order matters most to them.
 */
export function CompassPage() {
	const { t } = useTranslation();
	const { overview } = useCompass();
	const categories = inPresentationOrder(overview.categories, (one) => one.category.dimension);

	return (
		<div className="flex flex-col gap-6">
			<section className="flex flex-col gap-2">
				<div className="flex flex-wrap items-baseline justify-between gap-2">
					<span className="font-medium">
						{t('sfc.progress.overall', {
							answered: overview.overallProgress.answered,
							total: overview.overallProgress.total,
							percentage: overview.overallProgress.percentage,
						})}
					</span>
					<span className="text-sm opacity-70">
						{t('sfc.estimate.total', { minutes: estimatedMinutes(overview.overallEstimatedSeconds) })}
					</span>
				</div>
				<ProgressBar
					percentage={overview.overallProgress.percentage}
					label={t('sfc.progress.overallLabel')}
					className="w-full"
				/>
			</section>

			<ul className="grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
				{categories.map((one) => (
					<li key={one.category.id}>
						<CategoryCard overview={one} />
					</li>
				))}
			</ul>
		</div>
	);
}
