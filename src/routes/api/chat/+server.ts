import { YOUTUBE_API_KEY } from '$env/static/private';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { openai } from '$lib/server/openai';

import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';
import { google } from 'googleapis';

export interface MovieRecommendation {
	content: Content;
	similarity: number;
}

export interface Content {
	DVD: string;
	Plot: string;
	Type: string;
	Year: string;
	Genre: string;
	Rated: string;
	Title: string;
	Actors: string;
	Awards: string;
	Poster: string;
	Writer: string;
	imdbID: string;
	Country: string;
	Ratings: string[];
	Runtime: string;
	Website: string;
	Director: string;
	Language: string;
	Released: string;
	Response: string;
	BoxOffice: string;
	Metascore: string;
	imdbVotes: string;
	Production: string;
	imdbRating: string;
}

const youtubeApi = google.youtube({
	version: 'v3',
	auth: YOUTUBE_API_KEY
});

export const POST = (async ({ request }) => {
	// Extract the `prompt` from the body of the request
	const { messages } = await request.json();

	const embeddingResponse = await openai.embeddings.create({
		model: 'text-embedding-ada-002',
		input: messages[messages.length - 1].content
	});

	const { error: matchError, data: movieMatches } = await supabase.rpc('find_closest_movies', {
		embedding: embeddingResponse.data[0].embedding,
		match_threshold: 0.7,
		match_count: 5
	});

	if (matchError) {
		console.error(matchError);
		throw error(400, matchError.message);
	}

	const typedMovieMatches = movieMatches.map((movieMatch) => {
		return movieMatch as unknown as MovieRecommendation;
	});

	const fullData = await Promise.all(
		typedMovieMatches.map(async ({ content }) => {
			const { data } = await youtubeApi.search.list({
				part: ['snippet'],
				q: `${content.Title} ${content.Year} trailer`,
				type: ['video'],
				maxResults: 1
			});

			const youtubeLink =
				data.items && data.items[0] && data.items[0].id
					? `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`
					: 'N/A';

			console.log(content.Title, youtubeLink);
			return {
				...content,
				youtubeLink
			};
		})
	);

	const fullDataString = fullData
		.map((movie) => {
			return `${movie.Title} (${movie.Year})
		Plot: ${movie.Plot}
		YouTube Trailer: ${movie.youtubeLink}
		`;
		})
		.join('\n"""\n');

	const systemPrompt = `You are a very enthusiastic movie specialist who loves to recommend people the right movies based on their mood and the movies they own.
Use the provided data delimited by triple quotes (""") to recommend a movie and alternatives.
Provide the trailers to YouTube in a nicely formatted call to action, wrapped in HTML anchor tags that open in a new tab (like such: <a target="_blank" href="[link]" >[text]</a>) (never use markdown to format the link) and put a class of "youtube-trailer" on the anchor tags.
Also give a reason for your answer.
If there are no alternatives, don't give alternatives.
If there is no data, say "You don't own any movies that fit your request.".
Example:
"""
Movie: The Matrix (1999)
Plot: A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.
YouTube Trailer: <a target="_blank" href="https://www.youtube.com/watch?v=m8e-FF8MsqU" class="youtube-trailer">The Matrix (1999) Trailer</a>
"""
User request/question/preference:
"""
I want to watch a movie with a lot of action.
"""
Answer:
"""
Based on your request, I recommend The Matrix (1999) because it has a lot of action.
It is about a computer hacker who learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.
Here is the trailer: <a target="_blank" href="https://www.youtube.com/watch?v=m8e-FF8MsqU" class="youtube-trailer">The Matrix (1999) Trailer</a>
"""
`;

	const userPrompt = `
Movies I own:
"""
${fullDataString}
"""

User request/question/preference:
"""
${messages[messages.length - 1].content}
"""`;

	messages.pop();
	messages.push({
		content: userPrompt,
		role: 'user'
	});

	const completionResponse = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		stream: true,
		temperature: 0.3,
		messages: [
			{
				content: systemPrompt,
				role: 'system'
			},
			...messages.map((message: any) => ({
				content: message.content,
				role: message.role
			}))
		]
	});

	// Convert the response into a friendly text-stream
	const stream = OpenAIStream(completionResponse);

	// Respond with the stream
	return new StreamingTextResponse(stream);
}) satisfies RequestHandler;
