import { createBrowserRouter, type RouteObject } from 'react-router';
import { RequireAuth } from '@/auth/RequireAuth';
import { AppLayout } from '@/layout/AppLayout';
import { DashboardPage } from '@/dashboard/DashboardPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SfcPage } from '@/sfc/SfcPage';

export const routes: RouteObject[] = [
	{
		path: '/',
		element: (
			<RequireAuth>
				<AppLayout />
			</RequireAuth>
		),
		children: [
			// `handle.titleKey` names the i18n key the page-title band renders.
			{ index: true, element: <HomePage />, handle: { titleKey: 'home.title' } },
			{ path: 'sfc', element: <SfcPage />, handle: { titleKey: 'sfc.title' } },
			{ path: 'dashboard', element: <DashboardPage />, handle: { titleKey: 'dashboard.title' } },
			// Feature routes get added here.
		],
	},
	{ path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes, {
	basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/',
});
