import { useId } from 'react';

interface ConfirmDialogProps {
	title: string;
	body: string;
	confirmLabel: string;
	cancelLabel: string;
	busy: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

/**
 * Asks before something that cannot be undone. Built from plain markup rather than the browser's own dialog, so it is
 * part of the page like everything else.
 */
export function ConfirmDialog({
	title,
	body,
	confirmLabel,
	cancelLabel,
	busy,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const titleId = useId();

	return (
		<div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby={titleId}>
			<div className="modal-box">
				<h3 id={titleId} className="text-lg">
					{title}
				</h3>
				<p className="py-4">{body}</p>
				<div className="modal-action">
					<button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
						{cancelLabel}
					</button>
					<button type="button" className="btn btn-primary" onClick={onConfirm} disabled={busy}>
						{busy && <span className="loading loading-xs loading-spinner" />}
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
