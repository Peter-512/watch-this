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
			console.log(
				content.Title,
				`https://www.youtube.com/watch?v=${
					data.items && data.items[0] && data.items[0].id ? data.items[0].id.videoId : ''
				}`
			);
			return {
				...content,
				'youtube-link':
					data.items && data.items[0] && data.items[0].id
						? `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`
						: 'N/A'
			};
		})
	);

	// const videoId = data.items && data.items[0] && data.items[0].id ? data.items[0].id.videoId : "";

	const prompt = `You are a very enthusiastic movie specialist who loves to recommend people the right movies based on their mood. 
Given the following json objects (which represent the movies the user owns), answer the users question below or make a recommendation if you think it's appropriate.
If you are asked to format a link to a YouTube trailer, always use HTML tags (<a href='[link]' >[text]</a>) and never markdown.
Never refer to the json objects directly, but rather use the information in them to answer the question. 
Provide the trailers to YouTube in a nicely formatted call to action, wrapped in a HTML (never use markdown to format the link) anchor tags and put a class of "youtube-trailer" on the anchor tags.
Also give a reason for your answer.
Finally, give a short list of alternative movies that the user owns. Never recommend a movie that the user doesn't own. 
If there are no alternatives, don't give alternatives.
Never recommend a movie that the user doesn't own which are listed below.
Context:
${JSON.stringify(fullData)}

Question: """
${messages[messages.length - 1].content}
"""`;

	const completionResponse = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		stream: true,
		messages: [
			{
				content: prompt,
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
