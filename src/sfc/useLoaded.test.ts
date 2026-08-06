import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLoaded } from './useLoaded';

/** A promise this test settles when it wants to, so each stage of a load can be inspected. */
function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

describe('loading what a screen needs', () => {
	it('is loading until the first load settles, then holds what it loaded', async () => {
		const first = deferred<string>();
		const load = () => first.promise;
		const { result } = renderHook(() => useLoaded(load));

		expect(result.current.loading).toBe(true);
		expect(result.current.value).toBeUndefined();

		await act(async () => {
			first.resolve('3 of 43 answered');
		});

		expect(result.current.loading).toBe(false);
		expect(result.current.value).toBe('3 of 43 answered');
	});

	it('reports the failure when a load fails, holding nothing', async () => {
		const first = deferred<string>();
		const load = () => first.promise;
		const refused = new Error('the API refused');
		const { result } = renderHook(() => useLoaded(load));

		await act(async () => {
			first.reject(refused);
		});

		expect(result.current.loading).toBe(false);
		expect(result.current.failure).toBe(refused);
		expect(result.current.value).toBeUndefined();
	});

	it('keeps showing what it has while reloading, so a refresh never blanks the screen', async () => {
		let pending = deferred<string>();
		const load = () => pending.promise;
		const { result } = renderHook(() => useLoaded(load));
		await act(async () => {
			pending.resolve('3 of 43 answered');
		});

		const afterAnswering = deferred<string>();
		pending = afterAnswering;
		await act(async () => {
			void result.current.reload();
		});

		expect(result.current.value).toBe('3 of 43 answered');
		expect(result.current.loading).toBe(false);

		await act(async () => {
			afterAnswering.resolve('4 of 43 answered');
		});

		expect(result.current.value).toBe('4 of 43 answered');
	});

	it('starts over, showing nothing, when what it loads changes', async () => {
		const ecological = deferred<string>();
		const health = deferred<string>();
		const loadEcological = () => ecological.promise;
		const loadHealth = () => health.promise;
		const { result, rerender } = renderHook(({ load }: { load: () => Promise<string> }) => useLoaded(load), {
			initialProps: { load: loadEcological },
		});
		await act(async () => {
			ecological.resolve('Ecological sustainability');
		});

		rerender({ load: loadHealth });

		// The previous category must not appear under the new one's heading.
		expect(result.current.loading).toBe(true);
		expect(result.current.value).toBeUndefined();

		await act(async () => {
			health.resolve('Health');
		});

		expect(result.current.value).toBe('Health');
	});

	it('ignores a load that a newer one has already overtaken', async () => {
		const slow = deferred<string>();
		const fast = deferred<string>();
		let pending = slow;
		const load = () => pending.promise;
		const { result } = renderHook(() => useLoaded(load));

		pending = fast;
		await act(async () => {
			void result.current.reload();
		});
		await act(async () => {
			fast.resolve('the answer to the newer request');
		});
		await act(async () => {
			slow.resolve('the answer to the older request');
		});

		expect(result.current.value).toBe('the answer to the newer request');
	});
});
