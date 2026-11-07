import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaded } from '@/api/useLoaded';
import { LoadFailure } from '@/components/LoadFailure';
import { fetchOverview } from '@/sfc/sfc';
import { CompassInvitation } from './components/CompassInvitation';
import { MonthlyProgress } from './components/MonthlyProgress';
import { EmptyTotals, Totals } from './components/Totals';
import { currentMonth, fetchDashboard } from './dashboard';

/**
 * Where the user stands: the invitation to the compass until they have completed it, then their totals, or, before their
 * first purchase, what that purchase starts, then this month against the last. The dashboard and the compass overview
 * are loaded as one, so the page shows all of itself or, when either cannot be had, one failure.
 *
 * This month is the month of the browser's own date, taken when the page loads; a retry asks for the same month, so the
 * months named are always those the dashboard was read for.
 */
export function DashboardPage() {
	const { t } = useTranslation();
	const [month] = useState(() => currentMonth(new Date()));
	const load = useCallback(() => Promise.all([fetchDashboard(month), fetchOverview()]), [month]);
	const { value, loading, reload } = useLoaded(load);

	if (value === undefined) {
		return loading ? (
			<div className="flex justify-center p-8">
				<span className="loading loading-lg loading-spinner" aria-label={t('dashboard.loading')} />
			</div>
		) : (
			<LoadFailure message={t('dashboard.loadFailed')} onRetry={reload} />
		);
	}

	const [dashboard, overview] = value;
	return (
		<div className="flex flex-col gap-10 tabular-nums">
			<CompassInvitation overview={overview} />
			{dashboard.purchasedBasketCount > 0 ? (
				<Totals dashboard={dashboard} />
			) : (
				<EmptyTotals dashboard={dashboard} />
			)}
			<MonthlyProgress dashboard={dashboard} month={month} />
		</div>
	);
}
