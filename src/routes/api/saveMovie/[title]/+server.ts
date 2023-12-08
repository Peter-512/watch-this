import type { RequestHandler } from './$types';
import { OMDB_API_KEY } from '$env/static/private';
import { supabase } from '$lib/supabase';
import { json } from '@sveltejs/kit';
import { openai } from '$lib/server/openai';

type Movie =
	| {
			Title: string;
			Year: string;
			Rated: string;
			Released: string;
			Runtime: string;
			Genre: string;
			Director: string;
			Writer: string;
			Actors: string;
			Plot: string;
			Language: string;
			Country: string;
			Awards: string;
			Poster: string;
			Ratings: Rating[];
			Metascore: string;
			imdbRating: string;
			imdbVotes: string;
			imdbID: string;
			Type: string;
			DVD: string;
			BoxOffice: string;
			Production: string;
			Website: string;
			Response: 'True';
	  }
	| {
			Response: 'False';
			Error: string;
	  };

interface Rating {
	Source: string;
	Value: string;
}

export const POST: RequestHandler = async ({ fetch, params }) => {
	async function fetchMovieDetails(movieName: string) {
		const response = await fetch(
			`http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${OMDB_API_KEY}`
		);
		const movieData: Movie = await response.json();

		if (movieData.Response === 'False') {
			console.error(movieData.Error);
			return;
		}

		return movieData;
	}

	const title = params.title;
	const movieDetails = await fetchMovieDetails(title);
	if (!movieDetails) {
		return json({ title, success: false, message: 'Movie not found' });
	}

	// Check if the movie is already in the database
	const { data: movieData, error: e1 } = await supabase
		.from('movies')
		.select('imdbid')
		.eq('imdbid', movieDetails.imdbID);

	if (e1) {
		console.error(e1);
		return json({ title, success: false, message: 'Movie already in db' });
	}
	if (movieData?.length > 0) {
		return json({ title, success: false, message: 'database error' });
	}

	const [embeddings, tokenCount] = await generateEmbeddingsForMovies(movieDetails);

	const { error: e2 } = await supabase.from('movies').insert({
		imdbid: movieDetails.imdbID,
		content: JSON.stringify(movieDetails),
		token_count: tokenCount,
		embedding: embeddings[0]
	});

	if (e2) {
		console.error(e2);
		return json({ title, success: false, message: e2.message });
	}

	return json({ title, success: true, message: 'all gucci' });
};

async function generateEmbeddingsForMovies(movie: Movie) {
	const response = await openai.embeddings.create({
		model: 'text-embedding-ada-002',
		input: JSON.stringify(movie)
	});

	// embeddingResponse.data will be an array of embeddings
	const embeddings = response.data.map((item) => item.embedding);
	const tokenCount = response.usage.total_tokens;

	return [embeddings, tokenCount] as const;
}
