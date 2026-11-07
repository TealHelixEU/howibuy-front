import { Navigate, createBrowserRouter, type RouteObject } from 'react-router';
import { RequireAuth } from '@/auth/RequireAuth';
import { AppLayout } from '@/layout/AppLayout';
import { DashboardPage } from '@/dashboard/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { CategoryPage } from '@/sfc/CategoryPage';
import { CompassLayout } from '@/sfc/CompassLayout';
import { CompassPage } from '@/sfc/CompassPage';

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
			{ index: true, element: <Navigate to="/dashboard" replace /> },
			{
				path: 'sfc',
				element: <CompassLayout />,
				handle: { titleKey: 'sfc.title' },
				children: [
					{ index: true, element: <CompassPage /> },
					{ path: ':categoryId', element: <CategoryPage /> },
				],
			},
			{ path: 'dashboard', element: <DashboardPage />, handle: { titleKey: 'dashboard.title' } },
			// Feature routes get added here.
		],
	},
	{ path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes, {
	basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/',
});
