/**
 * How far along something is, from nothing to all of it. The {@link label} names what the bar is measuring, for whoever
 * cannot see it.
 */
export function ProgressBar({
	percentage,
	label,
	className,
}: {
	percentage: number;
	label: string;
	className?: string;
}) {
	return (
		<progress
			className={`progress progress-primary ${className ?? ''}`}
			value={percentage}
			max={100}
			aria-label={label}
		/>
	);
}
