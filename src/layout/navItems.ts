import type { ComponentType } from 'react';
import { FiBox, FiGrid, FiHome } from 'react-icons/fi';

export interface NavItem {
	to: string;
	labelKey: string;
	icon: ComponentType<{ className?: string }>;
	/** Match the route exactly (used for the index route). */
	end?: boolean;
}

// Feature routes get appended here as the app grows.
export const navItems: NavItem[] = [
	{ to: '/', labelKey: 'nav.home', icon: FiHome, end: true },
	{ to: '/sfc', labelKey: 'nav.sfc', icon: FiBox },
	{ to: '/dashboard', labelKey: 'nav.dashboard', icon: FiGrid },
];
