import { apiFetchWithToken } from '@/api/client';

/** The token a handed-over session runs on, and how long it has before it has to be renewed. */
export interface SessionToken {
	accessToken: string;
	expiresInSeconds: number;
}

interface SessionTokenResponse {
	access_token: string;
	expires_in: number;
}

/**
 * Redeem the ticket a retailer sent the user over with, for the first token of the session it opens. The ticket is the
 * credential here, so the request carries nothing else; a ticket is good for one redeem, whether or not this one succeeds.
 */
export async function redeemTicket(ticket: string): Promise<SessionToken> {
	return toSessionToken(
		await apiFetchWithToken<SessionTokenResponse>('/handoff/redeem', undefined, {
			method: 'POST',
			body: JSON.stringify({ ticket }),
		}),
	);
}

/**
 * Exchange the token a handed-over session runs on for the next one. The session slides on for as long as the user keeps
 * working, up to the end the first token of it fixed, which no renewal moves.
 *
 * @param accessToken The token to renew, which has to be unexpired: a session whose token has died is over.
 */
export async function renewSessionToken(accessToken: string): Promise<SessionToken> {
	return toSessionToken(
		await apiFetchWithToken<SessionTokenResponse>('/handoff/renew', accessToken, { method: 'POST' }),
	);
}

function toSessionToken(response: SessionTokenResponse): SessionToken {
	return { accessToken: response.access_token, expiresInSeconds: response.expires_in };
}
