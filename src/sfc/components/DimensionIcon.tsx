import type { ReactElement } from 'react';
import { FaCoins, FaCow, FaHeartPulse, FaLeaf, FaPeopleGroup } from 'react-icons/fa6';
import type { SustainabilityDimension } from '../sfc';

/**
 * A mark per dimension, so a category is recognised before it is read. Held as elements keyed by dimension, which makes
 * a dimension without a mark a compile error. They take their size and colour from whatever they sit in.
 */
const MARKS: Record<SustainabilityDimension, ReactElement> = {
	ECOLOGICAL: <FaLeaf />,
	SOCIAL: <FaPeopleGroup />,
	ECONOMIC: <FaCoins />,
	HEALTH: <FaHeartPulse />,
	ANIMAL_WELFARE: <FaCow />,
};

/** The mark standing for a dimension. Decoration: the category's name is always alongside it. */
export function DimensionIcon({ dimension, className }: { dimension: SustainabilityDimension; className?: string }) {
	return (
		<span className={className} aria-hidden="true">
			{MARKS[dimension]}
		</span>
	);
}
