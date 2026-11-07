import { apiFetch } from '@/api/client';
import { currentLanguage } from '@/i18n';

/**
 * The four facets a product is scored on. Not the compass's five dimensions: Socio-economic covers the compass's social
 * and economic ones together, and Environment is what the compass calls ecological.
 */
export type ScoredSustainabilityDimension = 'ENVIRONMENT' | 'ANIMAL_WELFARE' | 'SOCIO_ECONOMIC' | 'HEALTH';

/** A badge's code. Each level of a series is a badge of its own. */
export type Badge =
	| 'ENVIRONMENTAL_HERO_1'
	| 'ENVIRONMENTAL_HERO_2'
	| 'ENVIRONMENTAL_HERO_3'
	| 'ANIMAL_WELFARE_HERO_1'
	| 'ANIMAL_WELFARE_HERO_2'
	| 'ANIMAL_WELFARE_HERO_3'
	| 'SOCIO_ECONOMIC_HERO_1'
	| 'SOCIO_ECONOMIC_HERO_2'
	| 'SOCIO_ECONOMIC_HERO_3'
	| 'HEALTH_HERO_1'
	| 'HEALTH_HERO_2'
	| 'HEALTH_HERO_3';

/**
 * How the products the user bought in the month asked for score in a dimension, against those of the month before. The
 * averages are from 0 to 1, rounded to two decimals; the change is in percent of the previous average, rounded to one
 * decimal. The server rounds, so what is shown adds up.
 */
export interface DimensionProgress {
	dimension: ScoredSustainabilityDimension;
	/** Null when the user bought no scored product in the month asked for. */
	currentAverage: number | null;
	/** Null when the user bought no scored product in the month before. */
	previousAverage: number | null;
	/** Null when either average is, or the previous one is 0. */
	changePercent: number | null;
}

export interface BadgeLevel {
	badge: Badge;
	/** The badge's name, in the language asked for. */
	label: string;
	/** The number of products, scoring high in the series' dimension, that awards the badge. */
	requiredProducts: number;
	/**
	 * Whether the user holds it. A badge held stays earned when its number is raised past the user's count; a count that
	 * reaches a lowered number earns nothing until the next basket awards it.
	 */
	earned: boolean;
}

/** The badges of one dimension, with what the user has towards them. */
export interface BadgeSeries {
	dimension: ScoredSustainabilityDimension;
	/** The user's purchased products scoring high in the dimension, each counted every time it is bought. */
	productCount: number;
	/** Lowest level first. */
	levels: BadgeLevel[];
}

/**
 * Everything the dashboard shows, in one read. The server computes every figure, the rule numbers included; the
 * screen only formats them.
 */
export interface Dashboard {
	xpTotal: number;
	/**
	 * The percentage of the other shoppers whose XP total is below the user's, rounded down. Null without a purchase of
	 * the user's own, or without anyone to compare with. Sent whatever its value: whether to show it is the screen's call.
	 */
	xpPercentile: number | null;
	/** The XP of a product, as the explanations of XP quote it. */
	xpPerProduct: number;
	streak: number;
	/** 0 for a user who has bought nothing yet. */
	purchasedBasketCount: number;
	/** One per dimension, in no order the screen shows. */
	monthlyProgress: DimensionProgress[];
	/** One per dimension, in no order the screen shows. */
	badgeSeries: BadgeSeries[];
}

/**
 * The month the user calls this month, as the API takes it (`YYYY-MM`): the one of the browser's local date. A purchase
 * counts in the month of its date at the shop, so this is the user's month, not the server's.
 */
export function currentMonth(now: Date): string {
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** The user's dashboard, with the given month as this month. */
export function fetchDashboard(month: string): Promise<Dashboard> {
	return apiFetch<Dashboard>(`/dashboard?month=${month}&lang=${currentLanguage()}`);
}
