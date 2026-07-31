export interface NavItem {
	to: string;
	labelKey: string;
	/** Match the route exactly (used for the index route). */
	end?: boolean;
}

// Feature routes get appended here as the app grows.
export const navItems: NavItem[] = [
	{ to: '/', labelKey: 'nav.home', end: true },
	{ to: '/sfc', labelKey: 'nav.sfc' },
	{ to: '/dashboard', labelKey: 'nav.dashboard' },
];
