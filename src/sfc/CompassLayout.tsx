import { useCallback } from 'react';
import { Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useLoaded } from '@/api/useLoaded';
import { LoadFailure } from '@/components/LoadFailure';
import { TakeAgain } from './components/TakeAgain';
import type { Compass } from './compassContext';
import { fetchOverview } from './sfc';

/**
 * Holds what every compass screen needs — the overview — and hands it to whichever screen is showing, along with the
 * means to ask for it again. It loads here rather than in each screen because the screens all want it: the compass shows
 * the categories from it, a category reads the other categories' progress from it, and both answer for the state of the
 * attempt.
 *
 * The load happens while rendering rather than before it, because the guard that establishes the session is itself a
 * rendered thing: nothing has a token to ask with until it has let the tree render.
 */
export function CompassLayout() {
	const { t } = useTranslation();
	const load = useCallback(() => fetchOverview(), []);
	const { value: overview, loading, reload } = useLoaded(load);

	if (overview === undefined) {
		return loading ? (
			<div className="flex justify-center p-8">
				<span className="loading loading-lg loading-spinner" aria-label={t('sfc.loading')} />
			</div>
		) : (
			<LoadFailure message={t('sfc.loadFailed')} onRetry={reload} />
		);
	}

	return (
		<div className="flex flex-col gap-5">
			<TakeAgain overview={overview} onStarted={reload} />
			<Outlet context={{ overview, refresh: reload } satisfies Compass} />
		</div>
	);
}
