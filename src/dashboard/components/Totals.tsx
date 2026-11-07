import type { ReactNode } from 'react';
import { useId, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { Explanation } from '@/components/Explanation';
import { badgeTally, closestBadge } from '@/dashboard/badges';
import type { Dashboard } from '@/dashboard/dashboard';
import { inCompassOrder } from '@/dashboard/dimensions';
import { shownPercentile } from '@/dashboard/percentile';
import { currentLanguage } from '@/i18n';

/** Whose explanation is open, if any. */
type Explained = 'xp' | 'streak' | null;

interface TotalsProps {
	dashboard: Dashboard;
}

/**
 * Where the user stands, in three tiles: the XP total and how it compares with other shoppers', the streak, and the
 * badges held with the closest one to come. XP and the streak each explain, when asked, how they are earned; one
 * explanation is open at a time.
 */
export function Totals({ dashboard }: TotalsProps) {
	const { t } = useTranslation();
	const [explained, setExplained] = useState<Explained>(null);
	const percentile = shownPercentile(dashboard.xpPercentile);
	const badges = badgeTally(dashboard.badgeSeries);
	const closest = closestBadge(dashboard.badgeSeries);

	return (
		<section aria-label={t('dashboard.totals')} className="flex flex-wrap gap-4">
			<Tile
				title={t('dashboard.xp.title')}
				wide
				explanation={
					<Explanation
						label={t('dashboard.xp.explain')}
						open={explained === 'xp'}
						onOpenChange={(open) => setExplained(open ? 'xp' : null)}
					>
						<p>{t('dashboard.xp.earning', { xp: dashboard.xpPerProduct })}</p>
						{/* Nothing on the tile compares the user with anyone below the cutoff, so neither does this. */}
						{percentile !== null && <p>{t('dashboard.xp.compared')}</p>}
					</Explanation>
				}
			>
				<BigNumber value={dashboard.xpTotal} unit={t('dashboard.xp.unit')} />
				{percentile !== null && (
					<div className="flex flex-col gap-1.5">
						<p className="font-semibold">{t('dashboard.xp.ahead', { share: percentile / 100 })}</p>
						<div aria-hidden="true" className="relative h-2 rounded-full bg-base-300">
							<div
								className="absolute inset-y-0 left-0 rounded-full bg-primary"
								style={{ width: `${percentile}%` }}
							/>
						</div>
					</div>
				)}
			</Tile>

			<Tile
				title={t('dashboard.streak.title')}
				explanation={
					<Explanation
						label={t('dashboard.streak.explain')}
						open={explained === 'streak'}
						onOpenChange={(open) => setExplained(open ? 'streak' : null)}
					>
						<p>{t('dashboard.streak.earning')}</p>
					</Explanation>
				}
			>
				<BigNumber value={dashboard.streak} unit={t('dashboard.streak.unit', { count: dashboard.streak })} />
			</Tile>

			<Tile title={t('dashboard.badges.title')}>
				<BigNumber value={badges.earned} unit={t('dashboard.badges.ofAll', { total: badges.all })} />
				{closest !== undefined && (
					<p className="text-sm">
						<Trans
							i18nKey="dashboard.badges.closest"
							count={closest.toGo}
							values={{ label: closest.level.label }}
							components={{ strong: <strong className="font-semibold" /> }}
						/>
					</p>
				)}
			</Tile>
		</section>
	);
}

interface EmptyTotalsProps {
	dashboard: Dashboard;
}

/**
 * What the dashboard shows instead of the totals to a user who has bought nothing yet: what the first purchase starts,
 * and the three counters at zero, each with the rule that earns it.
 */
export function EmptyTotals({ dashboard }: EmptyTotalsProps) {
	const { t } = useTranslation();
	const titleId = useId();
	const badges = badgeTally(dashboard.badgeSeries);
	// Every series awards its levels at the same numbers, so the first one shown speaks for all of them.
	const [first, second, third] =
		inCompassOrder(dashboard.badgeSeries, (one) => one.dimension)[0]?.levels.map(
			(level) => level.requiredProducts,
		) ?? [];

	return (
		<section aria-labelledby={titleId} className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<h2 id={titleId} className="m-0">
					{t('dashboard.empty.title')}
				</h2>
				<p>{t('dashboard.empty.text')}</p>
			</div>

			<div className="flex flex-wrap gap-4">
				<Tile title={t('dashboard.xp.title')} heading="h3" wide>
					<BigNumber value={dashboard.xpTotal} unit={t('dashboard.xp.unit')} muted />
					<p>{t('dashboard.xp.rule', { xp: dashboard.xpPerProduct })}</p>
				</Tile>
				<Tile title={t('dashboard.streak.title')} heading="h3">
					<BigNumber
						value={dashboard.streak}
						unit={t('dashboard.streak.unit', { count: dashboard.streak })}
						muted
					/>
					<p>{t('dashboard.streak.rule')}</p>
				</Tile>
				<Tile title={t('dashboard.badges.title')} heading="h3">
					<BigNumber value={badges.earned} unit={t('dashboard.badges.ofAll', { total: badges.all })} muted />
					<p>{t('dashboard.badges.rule', { first, second, third })}</p>
				</Tile>
			</div>
		</section>
	);
}

interface TileProps {
	title: string;
	heading?: 'h2' | 'h3';
	wide?: boolean;
	explanation?: ReactNode;
	children: ReactNode;
}

/**
 * A card in the row of totals. The XP tile is the wide one, growing twice as fast as the others. The card is positioned,
 * so that its explanation opens over it.
 */
function Tile({ title, heading: Heading = 'h2', wide = false, explanation, children }: TileProps) {
	return (
		<div
			className={classNames(
				'card relative min-w-0 border border-base-300 bg-base-100',
				wide ? 'flex-[2_1_300px]' : 'flex-[1_1_220px]',
			)}
		>
			<div className="card-body gap-3 text-base">
				<div className="flex items-center justify-between gap-2">
					<Heading className="m-0 text-[18px]">{title}</Heading>
					{explanation}
				</div>
				{children}
			</div>
		</div>
	);
}

interface BigNumberProps {
	value: number;
	unit: string;
	muted?: boolean;
}

/** A total in large figures, followed by its unit. Muted, it reads as a counter not started yet. */
function BigNumber({ value, unit, muted = false }: BigNumberProps) {
	return (
		<p
			className={classNames(
				'flex flex-wrap items-baseline gap-x-2 gap-y-1',
				muted ? 'opacity-60' : 'text-brand-blue',
			)}
		>
			<span className="text-[56px] leading-none font-medium tracking-[1px] font-stretch-75%">
				{new Intl.NumberFormat(currentLanguage()).format(value)}
			</span>
			<span className="text-[18px] font-semibold">{unit}</span>
		</p>
	);
}
