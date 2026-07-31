import { configureAccessTokenSource } from '@/auth/session';
import { renewSessionToken, wasRefused, type SessionToken } from './handoff';

/**
 * How a handed-over session came to be one that cannot be worked in. The three read differently to the user: a link that
 * was refused never opened a session, a service that could not be reached may yet open one, and a session that is over was
 * worked in until it ran its course.
 */
export type HandoffSessionEnd = 'linkRefused' | 'serviceUnreachable' | 'sessionOver';

/** Whether this tab is in a session handed over from a retailer, and if so whether it can still be worked in. */
export type HandoffSessionState = 'none' | 'live' | HandoffSessionEnd;

/**
 * How close to expiry a token is renewed. The window has to be wide enough that the renewal is answered before the token
 * it replaces expires, and is far wider than that, so that a request rarely finds a token with less life left in it than
 * a renewal takes.
 */
const RENEW_WITHIN_MS = 120_000;

/** The tab, not the browser: a handed-over session is the one the retailer opened, and nothing of it outlives that tab. */
const STORAGE_KEY = 'howibuy.handoffSession';

type StoredSession = { accessToken: string; expiresAt: number } | { ended: HandoffSessionEnd };

let renewal: Promise<string | undefined> | null = null;

const watchers = new Set<() => void>();

/**
 * Watch the session for the moments it changes, which are chiefly the moment it ends. A session ends of its own accord —
 * on a renewal the API refuses — rather than on anything the user did, so nothing they do would otherwise be the occasion
 * to look at it again.
 *
 * @returns How to stop watching.
 */
export function subscribeToHandoffSession(watcher: () => void): () => void {
	watchers.add(watcher);
	return () => {
		watchers.delete(watcher);
	};
}

/** Take over the session the redeemed ticket opened, and answer for it from here on. */
export function beginHandoffSession(token: SessionToken): void {
	remember(asStored(token));
	configureAccessTokenSource(handoffAccessToken);
}

/**
 * Answer again for the session this tab was already in, after a reload.
 *
 * @returns Whether the tab was in one — a session that is over included, because the user of one has no other login to be
 *          sent to.
 */
export function resumeHandoffSession(): boolean {
	if (remembered() === null) {
		return false;
	}
	configureAccessTokenSource(handoffAccessToken);
	return true;
}

/**
 * Mark the handed-over session this tab is in one that cannot be worked in, and how it came to be that. It goes on
 * answering for the session all the same, so that the user of one is never given the token of another login they have no
 * part in.
 */
export function endHandoffSession(end: HandoffSessionEnd): void {
	remember({ ended: end });
	configureAccessTokenSource(handoffAccessToken);
}

export function handoffSessionState(): HandoffSessionState {
	const session = remembered();
	if (session === null) {
		return 'none';
	}
	if ('ended' in session) {
		return session.ended;
	}
	return session.expiresAt > Date.now() ? 'live' : 'sessionOver';
}

/**
 * The token of the session, renewed first when it is close to expiry so that the request it is wanted for still travels on
 * a live one. A token already past its expiry is not renewed but written off: a renewal would be refused, so the session
 * is over, and is recorded as over so that the application comes to say so.
 */
async function handoffAccessToken(): Promise<string | undefined> {
	const session = remembered();
	if (session === null || 'ended' in session) {
		return undefined;
	}
	const msLeft = session.expiresAt - Date.now();
	if (msLeft <= 0) {
		remember({ ended: 'sessionOver' });
		return undefined;
	}
	return msLeft > RENEW_WITHIN_MS ? session.accessToken : renew(session.accessToken);
}

/**
 * Whoever wants the token while a renewal is in flight waits for that one rather than starting another: a second renewal
 * would present the token the first has already replaced.
 *
 * A refusal is the end of the session, there being no reason the API would renew the same token later. A renewal that
 * never arrived leaves the session as it was, on a token that has life left in it, for the next request to try again.
 */
function renew(accessToken: string): Promise<string | undefined> {
	renewal ??= renewSessionToken(accessToken)
		.then((token) => {
			remember(asStored(token));
			return token.accessToken;
		})
		.catch((failure: unknown) => {
			if (wasRefused(failure)) {
				remember({ ended: 'sessionOver' });
				return undefined;
			}
			return accessToken;
		})
		.finally(() => {
			renewal = null;
		});
	return renewal;
}

function asStored(token: SessionToken): StoredSession {
	return { accessToken: token.accessToken, expiresAt: Date.now() + token.expiresInSeconds * 1000 };
}

function remember(session: StoredSession): void {
	sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
	watchers.forEach((watcher) => {
		watcher();
	});
}

function remembered(): StoredSession | null {
	const stored = sessionStorage.getItem(STORAGE_KEY);
	return stored === null ? null : (JSON.parse(stored) as StoredSession);
}
