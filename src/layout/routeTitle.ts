import { useMatches } from 'react-router';

interface TitleKeyHandle {
	titleKey: string;
}

function declaresTitleKey(handle: unknown): handle is TitleKeyHandle {
	return (
		typeof handle === 'object' &&
		handle !== null &&
		typeof (handle as Partial<TitleKeyHandle>).titleKey === 'string'
	);
}

/** i18n key for the current page's title, from the deepest matched route that declares one. */
export function useRouteTitleKey(): string | undefined {
	const handles = useMatches().map((match) => match.handle);
	return handles.filter(declaresTitleKey).at(-1)?.titleKey;
}
