import { useTranslation } from 'react-i18next';
import type { ScoredSustainabilityDimension } from '@/dashboard/dashboard';
import { SCORED_DIMENSION_MARKS } from './ScoredDimensionIcon';

/** The three arcs around the disc, on a circle of radius 21.5, clockwise from the top: one per level. */
const ARCS = [
	'M27.733 2.827A21.5 21.5 0 0 1 44.203 31.353',
	'M40.470 37.820A21.5 21.5 0 0 1 7.530 37.820',
	'M3.797 31.353A21.5 21.5 0 0 1 20.267 2.827',
];

/** How a medallion looks, earned or not yet. Its greys are its own, not the theme's. */
const LOOKS = {
	earned: { arc: 'stroke-primary', disc: 'fill-brand-blue stroke-brand-blue', mark: 'text-white' },
	notEarned: { arc: 'stroke-[#a3a3a3]', disc: 'fill-base-200 stroke-[#d0d0d0]', mark: 'text-[#767676]' },
};

/** The arcs beyond the level. */
const ARC_BEYOND = 'stroke-base-300';

interface BadgeIconProps {
	dimension: ScoredSustainabilityDimension;
	/** The badge's place in its series, from 1: as many arcs are coloured. */
	level: number;
	/** The badge's name. */
	label: string;
	earned: boolean;
	className?: string;
}

/**
 * A badge's medallion: its dimension's mark on a disc, and its level as one, two or three arcs around it. It is sized
 * by the font size it sits in, as the marks are.
 */
export function BadgeIcon({ dimension, level, label, earned, className }: BadgeIconProps) {
	const { t } = useTranslation();
	const looks = earned ? LOOKS.earned : LOOKS.notEarned;
	const Mark = SCORED_DIMENSION_MARKS[dimension];

	return (
		<svg
			viewBox="0 0 48 48"
			width="1em"
			height="1em"
			role="img"
			aria-label={t(earned ? 'dashboard.badges.medallionEarned' : 'dashboard.badges.medallionNotEarned', {
				label,
			})}
			className={className}
		>
			{ARCS.map((arc, index) => (
				<path
					key={arc}
					d={arc}
					fill="none"
					strokeWidth={3}
					strokeLinecap="round"
					className={index < level ? looks.arc : ARC_BEYOND}
				/>
			))}
			<circle cx={24} cy={24} r={16.5} strokeWidth={1} className={looks.disc} />
			<Mark x={15} y={15} size={18} className={looks.mark} />
		</svg>
	);
}
