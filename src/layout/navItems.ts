export interface NavItem {
	to: string;
	labelKey: string;
}

// Feature routes get appended here as the app grows.
export const navItems: NavItem[] = [
	{ to: '/dashboard', labelKey: 'nav.dashboard' },
	{ to: '/sfc', labelKey: 'nav.sfc' },
];
