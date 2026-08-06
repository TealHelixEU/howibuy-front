import { useOutletContext } from 'react-router';
import type { CompassOverview } from './sfc';

/**
 * What every compass screen is given: where the user stands across the whole compass, and the means to ask again once
 * the screen has changed something the server answers for.
 */
export interface Compass {
	overview: CompassOverview;
	refresh: () => Promise<void>;
}

export function useCompass(): Compass {
	return useOutletContext<Compass>();
}
