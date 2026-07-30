import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import eslintPlugin from '@nabla/vite-plugin-eslint';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

/**
 * @see https://vitejs.dev/config/
 */
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const basePath = (env.VITE_BASE_PATH || '/').replace(/\/?$/, '/');
	// Lint feedback belongs to the dev server: linting inside a test run costs time and puts
	// unrelated output in the test log. The plugin's own `apply: 'serve'` does not achieve this,
	// because Vitest also drives Vite in serve mode. As of 3.0.1 it additionally spawns a worker
	// thread it never terminates, which stalls Vitest's shutdown for the full teardown timeout.
	const underVitest = process.env.VITEST === 'true';

	return {
		base: basePath,
		plugins: [react(), tailwindcss(), ...(underVitest ? [] : [eslintPlugin()])],
		resolve: {
			alias: {
				'@': path.resolve(import.meta.dirname, './src'),
			},
		},
		server: {
			port: 5175,
			strictPort: true,
		},
		test: {
			environment: 'jsdom',
			globals: true,
			coverage: {
				provider: 'v8',
				reporter: ['text', 'html'],
			},
		},
	};
});
