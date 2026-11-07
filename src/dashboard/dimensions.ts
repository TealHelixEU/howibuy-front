import { inPresentationOrder } from '@/sfc/dimensions';
import type { SustainabilityDimension } from '@/sfc/sfc';
import type { ScoredSustainabilityDimension } from './dashboard';

/**
 * Where each dimension a product is scored on stands among the compass's, which is what places it on the dashboard.
 * Socio-economic covers the compass's social and economic dimensions, which the compass shows side by side, so it stands
 * where the first of them does.
 */
const AMONG_THE_COMPASS: Record<ScoredSustainabilityDimension, SustainabilityDimension> = {
	ENVIRONMENT: 'ECOLOGICAL',
	SOCIO_ECONOMIC: 'SOCIAL',
	HEALTH: 'HEALTH',
	ANIMAL_WELFARE: 'ANIMAL_WELFARE',
};

const NAME_KEYS: Record<ScoredSustainabilityDimension, string> = {
	ENVIRONMENT: 'dashboard.dimension.environment',
	SOCIO_ECONOMIC: 'dashboard.dimension.socioEconomic',
	HEALTH: 'dashboard.dimension.health',
	ANIMAL_WELFARE: 'dashboard.dimension.animalWelfare',
};

/**
 * The given items in the order the compass shows the dimensions: Environment, Socio-economic, Health, Animal welfare.
 * The API sends its own order, which no user reads. A dimension this application has not been taught about goes last.
 */
export function inCompassOrder<T>(items: readonly T[], dimensionOf: (item: T) => ScoredSustainabilityDimension): T[] {
	return inPresentationOrder(items, (item) => AMONG_THE_COMPASS[dimensionOf(item)]);
}

/** The i18n key of a dimension's name. */
export function dimensionNameKey(dimension: ScoredSustainabilityDimension): string {
	return NAME_KEYS[dimension];
}
