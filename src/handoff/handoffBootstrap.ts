import { redeemTicket } from './handoff';
import { beginHandoffSession, endHandoffSession, resumeHandoffSession } from './handoffSession';

/** The name the retailer puts the ticket under, in the fragment of the URL it sends the user to. */
const TICKET_PARAMETER = 'ticket';

/**
 * Start the session this page load belongs to, before anything of the application renders: the one a ticket in the URL
 * opens, or the one the tab was already in. A visit that arrives with neither is left to the OIDC login.
 *
 * The ticket travels in the fragment of the URL, which browsers keep to themselves, and is taken out of it before it is
 * presented. That this runs here rather than inside a component is what keeps a ticket to the one redeem it is good for:
 * React renders a component twice over in development, and the second redeem of a ticket rightly fails.
 */
export async function bootstrapHandoffSession(): Promise<void> {
	const ticket = ticketInUrl();
	if (ticket === null) {
		resumeHandoffSession();
		return;
	}
	takeTicketOutOfUrl();
	try {
		beginHandoffSession(await redeemTicket(ticket));
	} catch (_e) {
		endHandoffSession();
	}
}

function ticketInUrl(): string | null {
	return new URLSearchParams(window.location.hash.slice(1)).get(TICKET_PARAMETER);
}

function takeTicketOutOfUrl(): void {
	window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
}
