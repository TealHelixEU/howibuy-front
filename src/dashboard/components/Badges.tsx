import { useId } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ProgressBar } from '@/components/ProgressBar';
import { badgeTally, nextBadge } from '@/dashboard/badges';
import type { BadgeSeries } from '@/dashboard/dashboard';
import { dimensionNameKey, inCompassOrder } from '@/dashboard/dimensions';
import { BadgeIcon } from './BadgeIcon';
import { Block } from './Block';
import { ScoredDimensionIcon } from './ScoredDimensionIcon';

interface BadgesProps {
	series: readonly BadgeSeries[];
}

/**
 * The badges: a card per series, in the compass's order, with its levels, which of them are earned, and how far the
 * user is from the next. Whether a badge is earned is the API's, never worked out from the count, which a badge's number
 * can have since been moved past.
 */
export function Badges({ series }: BadgesProps) {
	const { t } = useTranslation();
	const { earned, all } = badgeTally(series);

	return (
		<Block title={t('dashboard.badges.title')} note={t('dashboard.badges.earned', { earned, total: all })}>
			<p>{t('dashboard.badges.text')}</p>
			<div className="flex flex-wrap gap-4">
				{inCompassOrder(series, (one) => one.dimension).map((one) => (
					<BadgeSeriesCard key={one.dimension} series={one} />
				))}
			</div>
		</Block>
	);
}

interface BadgeSeriesCardProps {
	series: BadgeSeries;
}

/** A series: its levels, and the next of them with the products to go, or that all three are earned. */
function BadgeSeriesCard({ series }: BadgeSeriesCardProps) {
	const { t } = useTranslation();
	const titleId = useId();
	const { earned, all } = badgeTally([series]);
	const next = nextBadge(series);

	return (
		<div
			role="group"
			aria-labelledby={titleId}
			className="card min-w-0 flex-[1_1_400px] border border-base-300 bg-base-100"
		>
			<div className="card-body gap-4 text-base">
				<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
					<h3 id={titleId} className="m-0 flex items-center gap-2 text-[22px] leading-[1.1]">
						<ScoredDimensionIcon dimension={series.dimension} className="flex text-[20px] text-primary" />
						<span>{t(dimensionNameKey(series.dimension))}</span>
					</h3>
					<span className="text-sm opacity-70">{t('dashboard.badges.earned', { earned, total: all })}</span>
				</div>

				<ol className="flex gap-4">
					{series.levels.map((level, index) => (
						<li
							key={level.badge}
							className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center leading-[1.3]"
						>
							<BadgeIcon
								dimension={series.dimension}
								level={index + 1}
								label={level.label}
								earned={level.earned}
								className="text-[56px]"
							/>
							<span className="font-semibold">{t('dashboard.badges.level', { level: index + 1 })}</span>
							<span className="text-sm leading-[1.3] opacity-70">
								{level.earned
									? t('dashboard.badges.levelEarned')
									: t('dashboard.badges.requiredProducts', { count: level.requiredProducts })}
							</span>
						</li>
					))}
				</ol>

				{next === undefined ? (
					<p className="font-semibold">{t('dashboard.badges.allEarned')}</p>
				) : (
					<div className="flex flex-col gap-2">
						<p>
							<Trans
								i18nKey="dashboard.badges.next"
								values={{ label: next.level.label }}
								components={{ strong: <strong className="font-semibold" /> }}
							/>
						</p>
						<ProgressBar
							percentage={Math.min(100, (100 * series.productCount) / next.level.requiredProducts)}
							label={next.level.label}
							className="w-full"
						/>
						<div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm">
							<span>
								{t('dashboard.badges.productCount', {
									productCount: series.productCount,
									count: next.level.requiredProducts,
								})}
							</span>
							<span className="opacity-70">{t('dashboard.badges.toGo', { count: next.toGo })}</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
