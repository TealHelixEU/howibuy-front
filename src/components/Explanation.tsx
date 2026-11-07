import type { ReactNode } from 'react';
import { useEffect, useId } from 'react';
import { FaCircleInfo } from 'react-icons/fa6';
import classNames from 'classnames';

interface ExplanationProps {
	/** Names what is explained, for the button. */
	label: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: ReactNode;
}

/**
 * An (i) button that opens a short explanation of what it sits next to, dimming the rest of the page while it is open.
 * Esc, a click on the dimmed page, or the button again closes it.
 *
 * Whether it is open is for whoever holds it to say, so that a screen with several keeps one open at a time. The button
 * goes at the end of a title row, its negative margins pulling it into the corner so that the row keeps its height. The
 * box is placed against the nearest positioned ancestor, which the holder makes the card being explained.
 */
export function Explanation({ label, open, onOpenChange, children }: ExplanationProps) {
	const boxId = useId();

	useEffect(() => {
		if (!open) {
			return;
		}
		function closeOnEscape(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				onOpenChange(false);
			}
		}
		document.addEventListener('keydown', closeOnEscape);
		return () => document.removeEventListener('keydown', closeOnEscape);
	}, [open, onOpenChange]);

	return (
		<>
			<button
				type="button"
				aria-label={label}
				aria-expanded={open}
				aria-controls={boxId}
				onClick={() => onOpenChange(!open)}
				className={classNames(
					'-my-2.5 -mr-2.5 flex size-11 flex-none cursor-pointer items-center justify-center rounded-full text-[20px] text-primary',
					open && 'bg-base-200',
				)}
			>
				<FaCircleInfo aria-hidden="true" />
			</button>
			{open && (
				<div
					data-testid="dimmed-page"
					aria-hidden="true"
					onClick={() => onOpenChange(false)}
					className="fixed inset-0 z-5 bg-[oklch(0%_0_0/0.4)]"
				/>
			)}
			<div
				id={boxId}
				hidden={!open}
				className="absolute top-[60px] right-3 z-10 flex w-[min(340px,calc(100%-24px))] flex-col gap-2 rounded-box border border-base-300 bg-base-100 p-4 text-[14px] leading-normal"
			>
				{children}
			</div>
		</>
	);
}
