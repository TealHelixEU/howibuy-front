import { getAccessToken as oidcAccessToken } from './userManager';

/** Where the session finds the token its requests carry. */
export type AccessTokenSource = () => Promise<string | undefined>;

let accessTokenSource: AccessTokenSource = oidcAccessToken;

/**
 * Let another login answer for the session from here on, for as long as the application runs. The login installs itself
 * here rather than this module knowing the logins there are, because a login has to reach the API to keep its token alive
 * and the API reads that token from here — naming each other would close the circle.
 */
export function configureAccessTokenSource(source: AccessTokenSource): void {
	accessTokenSource = source;
}

/**
 * The token to authenticate a request with, or undefined when the session has none. A session without a token is over,
 * and no other login is asked in its place.
 */
export function getAccessToken(): Promise<string | undefined> {
	return accessTokenSource();
}
