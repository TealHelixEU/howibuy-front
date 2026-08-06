import { useCallback, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { ProgressBar } from '@/components/ProgressBar';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { CategoryReview } from './components/CategoryReview';
import { CategoryStrip } from './components/CategoryStrip';
import { DimensionIcon } from './components/DimensionIcon';
import { LoadFailure } from './components/LoadFailure';
import { ScalePicker } from './components/ScalePicker';
import { useCompass } from './compassContext';
import {
	fetchCategoryQuestions,
	fetchNextQuestion,
	fetchPreviousQuestion,
	saveAnswer,
	type CategoryOverview,
	type Question,
	type ScaleOption,
} from './sfc';
import { useLoaded } from './useLoaded';

/** Which way the screen is facing: at one question to answer, or at the whole category to read back. */
type CategoryView =
	{ at: 'question'; question: Question; canStepBack: boolean } | { at: 'review'; questions: Question[] };

/** The search this screen carries while the user is looking at the question behind the one they were on. */
const STEPPED_BACK = 'step=back';

/**
 * Sorts out which category the address names before anything is asked of the API, so a category that does not exist is
 * not found rather than an empty questionnaire.
 */
export function CategoryPage() {
	const { categoryId } = useParams<{ categoryId: string }>();
	const { overview } = useCompass();
	const found = overview.categories.find((one) => one.category.id === categoryId);

	return found === undefined ? <NotFoundPage /> : <Category category={found} />;
}

/**
 * One category: the question to answer next, or — once every question in it is answered — the whole of it to read back.
 * Which of the two is showing is the server's answer about the frontier, not a guess from the answers held here, and it
 * changes as the last question is answered, so finishing a category leaves the user in it rather than anywhere else.
 */
function Category({ category }: { category: CategoryOverview }) {
	const { t } = useTranslation();
	const { overview, refresh } = useCompass();
	const [searchParams, setSearchParams] = useSearchParams();
	const [answerFailure, setAnswerFailure] = useState<string | null>(null);

	const categoryId = category.category.id;
	const steppedBack = searchParams.get('step') === 'back';
	const load = useCallback(() => viewOf(categoryId, steppedBack), [categoryId, steppedBack]);
	const { value: view, loading, reload } = useLoaded(load);

	async function answer(questionId: string, option: ScaleOption) {
		setAnswerFailure(null);
		try {
			await saveAnswer(questionId, option);
		} catch (failure) {
			if (refusedAsLocked(failure)) {
				setAnswerFailure('sfc.answerRefused');
				await refresh();
			} else {
				setAnswerFailure('sfc.answerFailed');
			}
			return;
		}
		await refresh();
		if (steppedBack) {
			// Answering the question behind the frontier is done with; leaving that address is what brings the next one back.
			setSearchParams({});
		} else {
			await reload();
		}
	}

	return (
		<div className="flex flex-col gap-5">
			{view?.at === 'review' && <CategoryStrip categories={overview.categories} currentId={categoryId} />}

			<CategoryHeading category={category} view={view} />

			{answerFailure !== null && (
				<div className="alert alert-error">
					<span>{t(answerFailure)}</span>
				</div>
			)}

			{view === undefined && loading && (
				<div className="flex justify-center p-8">
					<span className="loading loading-lg loading-spinner" aria-label={t('sfc.loading')} />
				</div>
			)}
			{view === undefined && !loading && <LoadFailure onRetry={reload} />}

			{view?.at === 'question' && (
				<section className="flex flex-col gap-4">
					<ScalePicker
						key={view.question.id}
						question={view.question}
						labels={overview.scaleLabels}
						onPick={(option) => answer(view.question.id, option)}
					/>
					{steppedBack ? (
						<Link to={{ search: '' }} className="link self-start text-sm">
							{t('sfc.question.backToCurrent')}
						</Link>
					) : (
						view.canStepBack && (
							<Link to={{ search: STEPPED_BACK }} className="link self-start text-sm">
								{t('sfc.question.previous')}
							</Link>
						)
					)}
				</section>
			)}

			{view?.at === 'review' && (
				<CategoryReview
					questions={view.questions}
					labels={overview.scaleLabels}
					revisable={overview.attemptStatus === 'IN_PROGRESS'}
					onAnswer={answer}
				/>
			)}
		</div>
	);
}

/**
 * What the screen is looking at. Stepping back asks for the question behind the frontier; anything else asks what comes
 * next, and takes the whole category to read back when nothing does.
 */
async function viewOf(categoryId: string, steppedBack: boolean): Promise<CategoryView> {
	if (steppedBack) {
		const previous = await fetchPreviousQuestion(categoryId);
		if (previous.question !== null) {
			return { at: 'question', question: previous.question, canStepBack: false };
		}
	}
	const next = await fetchNextQuestion(categoryId);
	if (next.question !== null) {
		return { at: 'question', question: next.question, canStepBack: next.question.position > 1 };
	}
	return { at: 'review', questions: await fetchCategoryQuestions(categoryId) };
}

/** Where the user is: which category, how far into it, and — while answering — which question of it. */
function CategoryHeading({ category, view }: { category: CategoryOverview; view: CategoryView | undefined }) {
	const { t } = useTranslation();
	const { progress } = category;

	return (
		<header className="flex flex-col gap-2">
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<h2 className="flex items-center gap-2 text-xl">
					<DimensionIcon dimension={category.category.dimension} className="text-primary" />
					{category.category.name}
				</h2>
				<span className="text-sm opacity-70">
					{view?.at === 'question'
						? t('sfc.question.position', { position: view.question.position, total: progress.total })
						: t('sfc.progress.category', { answered: progress.answered, total: progress.total })}
				</span>
			</div>
			<ProgressBar percentage={progress.percentage} label={category.category.name} className="w-full" />
		</header>
	);
}

/** Whether the API refused the answer because the user's last attempt still has to stay as it is. */
function refusedAsLocked(failure: unknown): boolean {
	return failure instanceof ApiError && failure.status === 409;
}
