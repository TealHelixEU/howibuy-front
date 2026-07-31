import { NavLink } from 'react-router';
import { useAuth } from 'react-oidc-context';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { navItems } from '../navItems';
import { BrandLogo } from './BrandLogo';

/** Logo left, navigation and account actions right, on a single 66px row. */
export function TopBar() {
	const auth = useAuth();
	const { t } = useTranslation();
	const email = auth.user?.profile.email ?? auth.user?.profile.name ?? '';

	return (
		<header className="bg-base-100 shadow-[0_1px_0_rgba(0,0,0,0.1)]">
			<div className="site-column flex h-[66px] items-center justify-between gap-4">
				<BrandLogo />

				<div className="flex items-center gap-4 md:gap-[22px]">
					<nav>
						<ul className="flex items-center gap-4 md:gap-[22px]">
							{navItems.map((item) => (
								<li key={item.to}>
									<NavLink
										to={item.to}
										end={item.end}
										className={({ isActive }) =>
											classNames(
												'font-semibold md:text-[18px]',
												isActive ? 'text-brand-teal' : 'text-brand-blue hover:text-brand-teal',
											)
										}
									>
										{t(item.labelKey)}
									</NavLink>
								</li>
							))}
						</ul>
					</nav>

					<span className="hidden h-6 w-px bg-base-300 sm:block" />
					<span className="hidden text-sm opacity-70 sm:inline">{email}</span>

					<button className="btn btn-primary btn-sm" onClick={() => void auth.signoutRedirect()}>
						{t('auth.logout')}
					</button>
				</div>
			</div>
		</header>
	);
}
