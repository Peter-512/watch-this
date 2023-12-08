import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return fail(400, { error: true, message: 'No file uploaded' });
		}

		const text = await file.text();

		const movies = text.trim().split('\n');

		for (const movie of movies) {
			const res = await fetch(`api/saveMovie/${movie}`, {
				method: 'POST'
			});
			const details = await res.json();
		}

		return {
			status: 200
		};
	}
};
