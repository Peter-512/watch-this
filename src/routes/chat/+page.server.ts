import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

const saveMovie = async function (movies: string[], fetch: any) {
	const errors: { error: true; message: string }[] = [];

	for (const movie of movies) {
		const res = await fetch(`api/saveMovie/${movie}`, {
			method: 'POST'
		});
		const details: { title: string; success: boolean; message: string } = await res.json();
		if (!details.success) {
			errors.push({ error: true, message: `${details.title}: ${details.message}` });
		}
	}
	return errors;
};
export const actions: Actions = {
	'file-upload': async ({ request, fetch }) => {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		if (file.size === 0) {
			return fail(400, { error: true, message: 'No file uploaded' });
		}

		const text = await file.text();

		const movies = text.trim().split('\n');
		const errors = await saveMovie(movies, fetch);

		return {
			error: false,
			message: 'Success',
			errors
		};
	},
	'text-input': async ({ request, fetch }) => {
		const formData = await request.formData();
		const moviesInput = formData.get('movies');
		if (!moviesInput) {
			return fail(400, { error: true, message: 'Empty input. Please enter movies to add.' });
		}
		const movies = (moviesInput as string).trim().split(',');
		const errors = await saveMovie(movies, fetch);

		return {
			error: false,
			message: 'Success',
			errors
		};
	}
};
