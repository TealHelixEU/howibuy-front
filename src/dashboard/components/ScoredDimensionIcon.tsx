import type { IconType } from 'react-icons';
import { FaCow, FaHandshake, FaHeartPulse, FaLeaf } from 'react-icons/fa6';
import type { ScoredSustainabilityDimension } from '@/dashboard/dashboard';

/**
 * A mark per dimension a product is scored on. Socio-economic is a handshake: fair dealing between people, covering the
 * social and the economic half. Held as icons keyed by dimension, which makes a dimension without a mark a compile
 * error. They take their size and colour from whatever they sit in.
 */
export const SCORED_DIMENSION_MARKS: Record<ScoredSustainabilityDimension, IconType> = {
	ENVIRONMENT: FaLeaf,
	SOCIO_ECONOMIC: FaHandshake,
	HEALTH: FaHeartPulse,
	ANIMAL_WELFARE: FaCow,
};

interface ScoredDimensionIconProps {
	dimension: ScoredSustainabilityDimension;
	className?: string;
}

/** The mark standing for a scored dimension. Decoration: the dimension's name is always alongside it. */
export function ScoredDimensionIcon({ dimension, className }: ScoredDimensionIconProps) {
	const Mark = SCORED_DIMENSION_MARKS[dimension];
	return (
		<span className={className} aria-hidden="true">
			<Mark />
		</span>
	);
}
