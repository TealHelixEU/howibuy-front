import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { inPresentationOrder } from '@/sfc/dimensions';
import type { CategoryOverview } from '@/sfc/sfc';
import { DimensionIcon } from './DimensionIcon';

/**
 * The way on from a category that is done: the others, each with how far the user has got in it. Which category to take
 * up next stays theirs to choose, so nothing here decides it for them.
 */
export function CategoryStrip({ categories, currentId }: { categories: CategoryOverview[]; currentId: string }) {
	const { t } = useTranslation();
	const others = inPresentationOrder(
		categories.filter((one) => one.category.id !== currentId),
		(one) => one.category.dimension,
	);

	return (
		<nav className="flex flex-wrap gap-2">
			{others.map(({ category, progress }) => (
				<Link key={category.id} to={`/sfc/${category.id}`} className="btn gap-2 btn-ghost btn-sm">
					<DimensionIcon dimension={category.dimension} className="text-primary" />
					<span>{category.name}</span>
					<span className="badge badge-sm">
						{t('sfc.progress.category', { answered: progress.answered, total: progress.total })}
					</span>
				</Link>
			))}
		</nav>
	);
}
