import { useTranslation } from 'react-i18next';
import { FaArrowDown, FaArrowUp, FaMinus } from 'react-icons/fa6';
import classNames from 'classnames';
import type { Dashboard, DimensionProgress } from '@/dashboard/dashboard';
import { dimensionNameKey, inCompassOrder } from '@/dashboard/dimensions';
import { currentLanguage } from '@/i18n';
import { Block } from './Block';
import { ScoredDimensionIcon } from './ScoredDimensionIcon';

/** The names of the month the dashboard was asked for and of the one before it, as the strings take them. */
interface MonthNames {
	current: string;
	previous: string;
}

interface MonthlyProgressProps {
	dashboard: Dashboard;
	/** The month the dashboard was asked for, `YYYY-MM`. */
	month: string;
}

/**
 * This month: per dimension, the average score of the products bought so far this month, as a bar, against last
 * month's, as a tick on it, and the change between the two. A month without purchases keeps the other month's average
 * on screen and shows no change, and a note above the rows says why. The averages and the change are the API's,
 * formatted only, so what the user reads adds up.
 */
export function MonthlyProgress({ dashboard, month }: MonthlyProgressProps) {
	const { t } = useTranslation();
	const months = monthNamesOf(month);
	const { current, previous } = months;
	const rows = inCompassOrder(dashboard.monthlyProgress, (one) => one.dimension);
	const nothingBought = dashboard.purchasedBasketCount === 0;
	const note = nothingBought ? null : noteOf(rows);

	return (
		<Block title={t('dashboard.month.title')} note={t('dashboard.month.note', { current, previous })}>
			<p>{t('dashboard.month.text')}</p>
			{note !== null && <p className="font-semibold">{t(note, { current, previous })}</p>}
			<div className="card border border-base-300 bg-base-100 px-6 py-1">
				{nothingBought ? (
					<p className="py-4 opacity-70">{t('dashboard.month.firstPurchase')}</p>
				) : (
					<ul className="divide-y divide-base-300">
						{rows.map((row) => (
							<Row key={row.dimension} progress={row} months={months} />
						))}
					</ul>
				)}
			</div>
			<p className="text-sm opacity-70">{t('dashboard.month.footnote', { current, previous })}</p>
		</Block>
	);
}

/**
 * What the note above the rows says, if anything. A month has all four averages or none, so whether one was bought in is
 * the same whichever dimension is asked.
 */
function noteOf(rows: DimensionProgress[]): string | null {
	const boughtThisMonth = rows.some((row) => row.currentAverage !== null);
	const boughtLastMonth = rows.some((row) => row.previousAverage !== null);
	if (boughtThisMonth && boughtLastMonth) {
		return null;
	}
	if (boughtLastMonth) {
		return 'dashboard.month.nothingThisMonth';
	}
	return boughtThisMonth ? 'dashboard.month.nothingLastMonth' : 'dashboard.month.nothingEither';
}

interface RowProps {
	progress: DimensionProgress;
	months: MonthNames;
}

/** A dimension: its name, the bar, and the figures. */
function Row({ progress, months }: RowProps) {
	const { t } = useTranslation();
	const { dimension, currentAverage, previousAverage, changePercent } = progress;
	const { current, previous } = months;
	const lastMonth =
		previousAverage === null ? null : t('dashboard.month.previousAverage', { previous, average: previousAverage });

	return (
		<li className="flex flex-wrap items-center gap-x-6 gap-y-2.5 py-4">
			<span className="flex min-w-0 flex-[1_1_200px] items-center gap-2.5 text-[18px] font-medium">
				<ScoredDimensionIcon dimension={dimension} className="flex text-primary" />
				<span>{t(dimensionNameKey(dimension))}</span>
			</span>

			<div
				role="img"
				aria-label={t('dashboard.month.bar', {
					dimension: t(dimensionNameKey(dimension)),
					thisMonth:
						currentAverage === null
							? t('dashboard.month.barThisMonthNothing', { current })
							: t('dashboard.month.barThisMonth', { current, average: currentAverage }),
					lastMonth: lastMonth ?? t('dashboard.month.barLastMonthNothing', { previous }),
				})}
				className="relative h-2.5 min-w-0 flex-[3_1_240px] rounded-full bg-base-300"
			>
				{currentAverage !== null && (
					<div
						className="absolute inset-y-0 left-0 rounded-full bg-primary"
						style={{ width: `${currentAverage * 100}%` }}
					/>
				)}
				{previousAverage !== null && (
					<div
						className="absolute -inset-y-[5px] w-[3px] -translate-x-1/2 bg-base-content"
						style={{ left: `${previousAverage * 100}%` }}
					/>
				)}
			</div>

			<div className="flex flex-[0_0_250px] flex-wrap items-baseline gap-x-3 gap-y-1.5">
				<span className="text-[30px] leading-none font-medium tracking-[1px] text-brand-blue font-stretch-75%">
					{currentAverage === null ? t('dashboard.month.noAverage') : formatAverage(currentAverage)}
				</span>
				<span className="text-sm opacity-70">
					{lastMonth ?? t('dashboard.month.noPurchases', { previous })}
				</span>
				{changePercent !== null && <Change percent={changePercent} />}
			</div>
		</li>
	);
}

const DIRECTIONS = {
	up: { Arrow: FaArrowUp, className: 'bg-success' },
	down: { Arrow: FaArrowDown, className: 'bg-warning' },
	none: { Arrow: FaMinus, className: 'bg-base-200' },
};

interface ChangeProps {
	/** In percent of last month's average. */
	percent: number;
}

/** The change from last month, in a pill coloured by its direction. */
function Change({ percent }: ChangeProps) {
	const { Arrow, className } = DIRECTIONS[percent > 0 ? 'up' : percent < 0 ? 'down' : 'none'];

	return (
		<span
			className={classNames(
				'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[14px] font-semibold text-base-content',
				className,
			)}
		>
			<Arrow aria-hidden="true" className="text-[12px]" />
			{new Intl.NumberFormat(currentLanguage(), {
				style: 'percent',
				minimumFractionDigits: 1,
				maximumFractionDigits: 1,
				signDisplay: 'exceptZero',
			}).format(percent / 100)}
		</span>
	);
}

/** An average on its own, to the two decimals of the display scale. Those within a sentence are formatted by it. */
function formatAverage(average: number): string {
	return new Intl.NumberFormat(currentLanguage(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
		average,
	);
}

/** The names of a `YYYY-MM` month and of the one before it, in the UI's language. */
function monthNamesOf(month: string): MonthNames {
	const [year, number] = month.split('-').map(Number);
	const name = new Intl.DateTimeFormat(currentLanguage(), { month: 'long' });
	return {
		current: name.format(new Date(year, number - 1, 1)),
		previous: name.format(new Date(year, number - 2, 1)),
	};
}
