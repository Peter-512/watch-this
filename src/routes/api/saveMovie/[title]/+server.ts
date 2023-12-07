import type { RequestHandler } from './$types';
import { OMDB_API_KEY,OPENAI_API_KEY } from '$env/static/private';

import { supabase } from '$lib/supabase';
import { error, json } from '@sveltejs/kit';
// import { OpenAIApi, Configuration } from 'openai';
import Configuration from "openai"
import OpenAIApi from 'openai';
import { readFile } from 'fs/promises';




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
	// movies is movie titles separated by newline
	const movies = await readFile('movies.txt', 'utf8');

	const movieTitles = movies.split('\n');
	const responses = [];
	const movieDetailsArray: { imdbID: string; plot: string; tokenCount: number; }[] = [];

	for (const title of movieTitles) {

		try {
			const movieDetails = await fetchMovieDetails(title);
			if (!movieDetails) {
				responses.push({ title, success: false, message: 'Movie not found' });
				continue;
			}

			movieDetailsArray.push(movieDetails);

			// Check if the movie is already in the database
			const { data: movieData, error: e1 } = await supabase
				.from('movies')
				.select('imdbID')
				.eq('imdbID', movieDetails.imdbID);

			if (e1 || movieData?.length > 0) {
				responses.push({ title, success: false, message: 'Movie already in db or database error' });
			}

		} catch (err) {
			responses.push({ title, success: false, message: err.message });
		}
	}

	if (movieDetailsArray.length > 0) {
		const plots = movieDetailsArray.map(details => details.plot);
		const embeddings = await generateEmbeddingsForMovies(plots);

		// Insert each movie into the database along with its embedding
		for (let i = 0; i < movieDetailsArray.length; i++) {
			const { imdbID, plot, tokenCount } = movieDetailsArray[i];
			const embedding = embeddings[i];

			try {
				const { error: e2 } = await supabase.from('movies').insert({
					imdbid: imdbID,
					content: plot,
					token_count: tokenCount,
					embedding: embedding
				});

				if (e2) throw new Error('Saving to db failed');
				else responses.push({ title: movieTitles[i], success: true, message: 'Saving to db successful' });

			} catch (err) {
				responses.push({ title: movieTitles[i], success: false, message: err.message });
			}
		}
	}

	return json({ responses });
};

// const newMovie: Partial<Movie> = {
// 	Actors: movie.Actors,
// 	Country: movie.Country,
// 	Plot: movie.Plot,
// 	Year: movie.Year,
// 	Title: movie.Title,
// 	Writer: movie.Writer,
// 	Runtime: movie.Runtime,
// 	Director: movie.Director
// };

// TODO: create embeddings from the newMovie
// save those embeddings with the imdbID as

async function fetchMovieDetails(movieName:string) {
	const response = await fetch(`http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${OMDB_API_KEY}`);
	const movieData = await response.json();


	if (movieData.Response === 'False') {
		throw new Error(movieData.Error);
	}

	const imdbID = movieData.imdbID;
	const plot = movieData.Plot;
	const tokenCount = plot.split(' ').length;
	return { imdbID, plot, tokenCount };
}

async function generateEmbeddingsForMovies(moviePlots:string[]) {

	//send multiple movie plots in one api call, receive a array of embeddings
	try {

		const response = await fetch('https://api.openai.com/v1/embeddings', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				model: 'text-embedding-ada-002',
				input: moviePlots
			})
		});


		if (!response.ok) {
			console.error("OpenAI API Error:", await response.text());
			throw new Error(`OpenAI API Error: ${response.status}`);
		}

		const embeddingResponse = await response.json();

		// embeddingResponse.data will be an array of embeddings
		const embeddings = embeddingResponse.data.map(item => item.embedding);

		console.log("Embedding Vectors:", embeddings);
		return embeddings;

	} catch (err) {
		console.error('Error in generateEmbeddingsForMovies:', err);
		throw err;
	}
}



