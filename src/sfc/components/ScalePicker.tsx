import { useState } from 'react';
import { RichText } from '@/components/RichText';
import { SCALE_OPTIONS, type Question, type ScaleOption } from '@/sfc/sfc';

interface ScalePickerProps {
	question: Question;
	labels: Record<ScaleOption, string>;
	onPick: (option: ScaleOption) => Promise<void>;
}

/**
 * A question and the five points it is answered on. Picking one is the answer — there is nothing further to confirm —
 * and the pick shows at once while it is being saved, with the rest held so a second pick cannot race the first.
 *
 * {@link onPick} answers for whether the save worked; it is expected to settle either way rather than throw, so that the
 * screen around it is the one that speaks about failure.
 */
export function ScalePicker({ question, labels, onPick }: ScalePickerProps) {
	const [picking, setPicking] = useState<ScaleOption | null>(null);
	const shown = picking ?? question.answer;
	const promptId = `question-${question.id}`;

	function pick(option: ScaleOption) {
		setPicking(option);
		void onPick(option).finally(() => setPicking(null));
	}

	return (
		<div className="flex flex-col gap-4">
			<RichText html={question.text} id={promptId} className="text-lg leading-relaxed" />

			<div role="radiogroup" aria-labelledby={promptId} className="flex flex-col gap-2">
				{SCALE_OPTIONS.map((option) => (
					<label
						key={option}
						className="flex cursor-pointer items-center gap-3 rounded-lg border border-base-300 p-3 transition-colors hover:border-primary has-checked:border-primary"
					>
						<input
							type="radio"
							className="radio radio-primary"
							name={promptId}
							value={option}
							checked={shown === option}
							disabled={picking !== null}
							onChange={() => pick(option)}
						/>
						<span>{labels[option]}</span>
					</label>
				))}
			</div>
		</div>
	);
}
