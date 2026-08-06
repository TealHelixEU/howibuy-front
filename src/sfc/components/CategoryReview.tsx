import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RichText } from '@/components/RichText';
import type { Question, ScaleOption } from '@/sfc/sfc';
import { ScalePicker } from './ScalePicker';

/**
 * A category the user has answered every question of, laid out to be read back: each question with the answer it was
 * given. While the attempt is still open any one of them can be picked up again, in place, without disturbing the rest.
 */
export function CategoryReview({
	questions,
	labels,
	revisable,
	onAnswer,
}: {
	questions: Question[];
	labels: Record<ScaleOption, string>;
	revisable: boolean;
	onAnswer: (questionId: string, option: ScaleOption) => Promise<void>;
}) {
	const { t } = useTranslation();
	const [revisiting, setRevisiting] = useState<string | null>(null);

	async function answer(question: Question, option: ScaleOption) {
		await onAnswer(question.id, option);
		setRevisiting(null);
	}

	return (
		<ol className="flex list-none flex-col gap-3 p-0">
			{questions.map((question) => (
				<li key={question.id} className="rounded-lg border border-base-300 p-4">
					{revisiting === question.id ? (
						<ScalePicker
							question={question}
							labels={labels}
							onPick={(option) => answer(question, option)}
						/>
					) : (
						<div className="flex flex-col gap-2">
							<RichText html={question.text} />
							<div className="flex flex-wrap items-baseline justify-between gap-2">
								<span className="font-medium text-primary">
									{question.answer === null ? '—' : labels[question.answer]}
								</span>
								{revisable && (
									<button
										type="button"
										className="btn btn-ghost btn-xs"
										onClick={() => setRevisiting(question.id)}
									>
										{t('sfc.question.revisit')}
									</button>
								)}
							</div>
						</div>
					)}
				</li>
			))}
		</ol>
	);
}
