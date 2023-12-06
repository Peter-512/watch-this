import type { RequestHandler } from './$types';
import { OMDB_API_KEY } from '$env/static/private';
import { supabase } from '$lib/supabase';
import { error, json } from '@sveltejs/kit';

interface Movie {
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
	Response: string;
}

interface Rating {
	Source: string;
	Value: string;
}

export const POST: RequestHandler = async ({ params, fetch }) => {
	const res = await fetch(`http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${params.title}`);
	const movie: Movie = await res.json();
	const { imdbID } = movie;

	const { data: movieData, error: e1 } = await supabase
		.from('movies')
		.select('imdbID')
		.eq('imdbID', imdbID);
	if (e1) throw error(404, 'Not found');

	if (movieData?.length > 0) return json({ error: false, message: 'Movie already in db' });

	const newMovie: Partial<Movie> = {
		Actors: movie.Actors,
		Country: movie.Country,
		Plot: movie.Plot,
		Year: movie.Year,
		Title: movie.Title,
		Writer: movie.Writer,
		Runtime: movie.Runtime,
		Director: movie.Director
	};

	// TODO: create embeddings from the newMovie
	// save those embeddings with the imdbID as PK

	const { error: e2 } = await supabase.from('movies').insert({
		imdbID
	});

	if (e2) throw error(500, 'Saving to db failed');

	return json({ error: false, message: 'Saving to db successful' });
};
