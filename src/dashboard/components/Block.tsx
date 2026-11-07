import type { ReactNode } from 'react';
import { useId } from 'react';

interface BlockProps {
	title: string;
	/** Sits at the other end of the title's row, on its baseline, and wraps under the title when there is no room. */
	note: string;
	children: ReactNode;
}

/** A block of the dashboard that opens with a heading row: This month, and the badges. */
export function Block({ title, note, children }: BlockProps) {
	const titleId = useId();

	return (
		<section aria-labelledby={titleId} className="flex flex-col gap-3">
			<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<h2 id={titleId} className="m-0">
					{title}
				</h2>
				<span className="text-sm opacity-70">{note}</span>
			</div>
			{children}
		</section>
	);
}
