import type { TFunction } from 'i18next';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
// language imports, let's keep them sorted alphabetically; same in the resources object
import en from './en.json';

const resources = {
	en: {
		translation: en,
	},
};

export function configureI18n(lng: string): Promise<TFunction> {
	// eslint-disable-next-line import-x/no-named-as-default-member
	return i18next.use(initReactI18next).init({
		resources,
		lng,
		fallbackLng: 'en',
		interpolation: {
			escapeValue: false, // not needed for react!!
		},
	});
}

/**
 * The language the application is showing, for the requests that ask the API for content in it. The API serves a closed
 * set of languages and refuses anything else outright, so what is asked for is the language this application itself has
 * resources for — never the browser's preference, which it may have none for.
 */
export function currentLanguage(): string {
	return i18next.language;
}
