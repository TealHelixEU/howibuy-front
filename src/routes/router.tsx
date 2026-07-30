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
			{ index: true, element: <HomePage /> },
			{ path: 'sfc', element: <SfcPage /> },
			{ path: 'dashboard', element: <DashboardPage /> },
			// Feature routes get added here.
		],
	},
	{ path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes, {
	basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/',
});
