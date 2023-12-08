import { OpenAIStream, StreamingTextResponse } from 'ai';
import { openai } from '$lib/server/openai';

import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';

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

	console.log(movieMatches);

	const prompt = `You are a very enthusiastic movie specialist who loves to recommend people the right movies based on their mood. Given the following json objects (which represent the movies the user owns), answer the users question below or make a recommendation if you think it's appropriate.
Never refer to the json objects directly, but rather use the information in them to answer the question. 
Also give a reason for your answer.
Finally, give a short list of alternative movies that the user owns. Never recommend a movie that the user doesn't own. If there are no alternatives, don't give alternatives.
Context:
${JSON.stringify(movieMatches.map(({ content }) => content))}

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
