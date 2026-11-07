import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * What a screen shows instead of itself when what it needs could not be had: the message it is given, and a way to try
 * again. The retry is the screen's own, since a page reload would cost the user their place.
 */
export function LoadFailure({ message, onRetry }: { message: string; onRetry: () => Promise<void> }) {
	const { t } = useTranslation();
	const [retrying, setRetrying] = useState(false);

	function retry() {
		setRetrying(true);
		void onRetry().finally(() => setRetrying(false));
	}

	return (
		<div className="alert alert-error">
			<span>{message}</span>
			<button type="button" className="btn btn-sm" onClick={retry} disabled={retrying}>
				{retrying && <span className="loading loading-xs loading-spinner" />}
				{t('common.retry')}
			</button>
		</div>
	);
}
