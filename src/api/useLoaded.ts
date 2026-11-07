import { useCallback, useEffect, useRef, useState } from 'react';

/** What a screen has of the thing it is loading, and the means to load it again. */
export interface Loaded<T> {
	value: T | undefined;
	failure: unknown;
	loading: boolean;
	reload: () => Promise<void>;
}

/** What a load settled on, remembered against the load it came from. */
interface Settlement<T> {
	load: () => Promise<T>;
	value?: T;
	failure?: unknown;
}

/**
 * Loads what a screen needs, and loads it again when the screen has changed something the server answers for.
 *
 * A first load, or a change of what is being loaded, shows nothing while it is in flight — the previous category's
 * question has no business appearing under the new one's heading. A reload leaves what is already there on screen, so
 * refreshing after an answer does not blank the page. Whichever load started last is the one whose answer is taken; an
 * earlier one arriving later is dropped.
 *
 * {@link load} must be stable — wrap it in {@code useCallback} over whatever it depends on, since a change of it is what
 * says "this is a different thing now". What is on screen is what some load settled on, held against the load that
 * produced it, so a change of load reads as nothing-yet without anything having to clear it.
 */
export function useLoaded<T>(load: () => Promise<T>): Loaded<T> {
	const [settlement, setSettlement] = useState<Settlement<T>>();
	const latest = useRef(0);

	const reload = useCallback(() => {
		const mine = ++latest.current;
		const stillWanted = () => mine === latest.current;
		return load().then(
			(value) => {
				if (stillWanted()) {
					setSettlement({ load, value });
				}
			},
			(failure: unknown) => {
				if (stillWanted()) {
					setSettlement({ load, failure });
				}
			},
		);
	}, [load]);

	useEffect(() => {
		void reload();
	}, [reload]);

	const settled = settlement?.load === load ? settlement : undefined;
	return { value: settled?.value, failure: settled?.failure, loading: settled === undefined, reload };
}
