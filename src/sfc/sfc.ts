import { apiFetch } from '@/api/client';
import { currentLanguage } from '@/i18n';

/** The facets of food sustainability the compass covers. One category addresses one of them. */
export type SustainabilityDimension = 'ECOLOGICAL' | 'SOCIAL' | 'ECONOMIC' | 'HEALTH' | 'ANIMAL_WELFARE';

/** The five points of the scale every question is answered on. */
export type ScaleOption =
	'NOT_IMPORTANT' | 'SLIGHTLY_IMPORTANT' | 'MODERATELY_IMPORTANT' | 'VERY_IMPORTANT' | 'EXTREMELY_IMPORTANT';

/**
 * The scale points in the order they are offered, least to most important. The order is fixed here rather than taken
 * from the labels the API sends, whose keys carry no order of their own.
 */
export const SCALE_OPTIONS: readonly ScaleOption[] = [
	'NOT_IMPORTANT',
	'SLIGHTLY_IMPORTANT',
	'MODERATELY_IMPORTANT',
	'VERY_IMPORTANT',
	'EXTREMELY_IMPORTANT',
];

/** Where an attempt stands. Absent altogether until the user has started one. */
export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED';

/** How far the user has got, over the whole compass or one category. */
export interface Progress {
	answered: number;
	total: number;
	percentage: number;
}

export interface Category {
	id: string;
	dimension: SustainabilityDimension;
	name: string;
	/** Rich text. */
	description: string;
	/** Not authored yet, so absent for every category today. */
	videoUrl: string | null;
	detailUrl: string | null;
}

export interface CategoryOverview {
	category: Category;
	progress: Progress;
	/** Seconds to answer all of the category's questions, not the ones left. */
	estimatedSeconds: number;
}

export interface CompassOverview {
	overallProgress: Progress;
	overallEstimatedSeconds: number;
	categories: CategoryOverview[];
	scaleLabels: Record<ScaleOption, string>;
	/** Null until the user has ever started an attempt. */
	attemptStatus: AttemptStatus | null;
	eligibleToStartNewAttempt: boolean;
	/**
	 * When the stability window of the latest completed attempt ends, null while there is no completed attempt to wait
	 * on. A local date-time, carrying no zone.
	 */
	eligibleAt: string | null;
}

export interface Question {
	id: string;
	position: number;
	/** Rich text. */
	text: string;
	/** Null when the user has not answered it on their current attempt. */
	answer: ScaleOption | null;
}

/** The frontier of a category, or the signal that every question in it is answered. */
export interface NextQuestion {
	complete: boolean;
	question: Question | null;
}

/** The question to step back to, or the signal that the user has answered nothing here to step back to. */
export interface PreviousQuestion {
	atStart: boolean;
	question: Question | null;
}

/**
 * Everything needed to show where the user stands: the categories with their text, progress and time estimates, the
 * labels of the five scale points, and the state of the attempt the answers belong to.
 */
export function fetchOverview(): Promise<CompassOverview> {
	return apiFetch<CompassOverview>(`/sfc/overview?lang=${currentLanguage()}`);
}

/** One category's questions in position order, each with the answer the user has given it, if any. */
export function fetchCategoryQuestions(categoryId: string): Promise<Question[]> {
	return apiFetch<Question[]>(`/sfc/categories/${categoryId}/questions?lang=${currentLanguage()}`);
}

/**
 * The question to put to the user next in this category. The server decides which one that is; the client does not
 * work it out from the answers it happens to hold.
 */
export function fetchNextQuestion(categoryId: string): Promise<NextQuestion> {
	return apiFetch<NextQuestion>(`/sfc/categories/${categoryId}/next-question?lang=${currentLanguage()}`);
}

/** The question behind the frontier — the last one the user answered here — with the answer they gave it. */
export function fetchPreviousQuestion(categoryId: string): Promise<PreviousQuestion> {
	return apiFetch<PreviousQuestion>(`/sfc/categories/${categoryId}/previous-question?lang=${currentLanguage()}`);
}

/**
 * Records the user's answer to one question, replacing any answer already there. Saved the moment it is made, so
 * nothing is lost by leaving. An answer is an ordinal, not text, so it carries no language.
 */
export function saveAnswer(questionId: string, option: ScaleOption): Promise<void> {
	return apiFetch<void>(`/sfc/questions/${questionId}/answer`, {
		method: 'PUT',
		body: JSON.stringify({ option }),
	});
}

/**
 * Completes the attempt in progress, freezing it as the record the compass exists to produce. Refused with 422 unless
 * every question is answered, and with 409 when nothing is in progress.
 */
export function completeAttempt(): Promise<void> {
	return apiFetch<void>('/sfc/attempts/current/completion', { method: 'POST' });
}

/**
 * Starts a fresh, blank attempt for a user taking the compass again. Refused with 409 while one is already in progress
 * or while the last completed attempt still has to stay stable.
 */
export function startNewAttempt(): Promise<void> {
	return apiFetch<void>('/sfc/attempts', { method: 'POST' });
}
