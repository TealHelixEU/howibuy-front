import { useSyncExternalStore } from 'react';
import { handoffSessionState, subscribeToHandoffSession, type HandoffSessionState } from './handoffSession';

/**
 * The state of the handed-over session this tab is in, as it stands and as it changes. The session is kept outside React,
 * being answered for on requests that have nothing to do with rendering, so what is rendered follows it rather than holds
 * it.
 */
export function useHandoffSessionState(): HandoffSessionState {
	return useSyncExternalStore(subscribeToHandoffSession, handoffSessionState);
}
