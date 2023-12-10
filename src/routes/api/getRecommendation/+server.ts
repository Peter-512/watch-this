import { kv } from '@vercel/kv';
import { openai } from '$lib/server/openai';
import { dev } from '$app/environment';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import type { RequestHandler } from '@sveltejs/kit';

// Object to store the number of requests made by each user and their last request timestamp
interface UserRequestData {
	count: number;
	lastResetTime: number;
}

async function getUserRequestData(userIP: string): Promise<UserRequestData | null> {
	try {
		const data = await kv.get<UserRequestData>(userIP);
		return data;
	} catch (error) {
		console.error('Error retrieving user request data:', error);
		throw error;
	}
}

async function updateUserRequestData(userIP: string, data: UserRequestData) {
	try {
		console.log(userIP);
		await kv.set(userIP, data);
	} catch (error) {
		console.error('Error updating user request data:', error);
		throw error;
	}
}

// Middleware function to enforce rate limits
async function rateLimitMiddleware(request: Request) {
	const userIP =
		request.headers.get('x-forwarded-for') || (request.headers.get('cf-connecting-ip') as string);
	const userRequests = await getUserRequestData(userIP);

	// Check if the user has made requests before
	if (userRequests) {
		const { count, lastResetTime } = userRequests;
		const currentTime = Date.now();

		// Check if it's a new day and reset the count
		const currentDay = new Date(currentTime).toLocaleDateString();
		const lastResetDay = new Date(lastResetTime).toLocaleDateString();
		if (currentDay !== lastResetDay) {
			userRequests.count = 1;
			userRequests.lastResetTime = currentTime;
			await updateUserRequestData(userIP, userRequests);
		} else {
			// Check if the user has exceeded the rate limit (5 requests per day)
			if (count >= 5) {
				return new Response('Rate limit exceeded, come back tomorrow!', { status: 429 });
			}

			// Increment the request count for the user
			userRequests.count++;
			await updateUserRequestData(userIP, userRequests);
		}
	} else {
		// Create a new user entry with initial request count and timestamp
		const newUserRequests: UserRequestData = {
			count: 1,
			lastResetTime: Date.now()
		};
		await updateUserRequestData(userIP, newUserRequests);
	}

	return null;
}

export const POST: RequestHandler = async ({ request }) => {
	// Apply rate limit middleware
	if (!dev) {
		const rateLimitResult = await rateLimitMiddleware(request);
		if (rateLimitResult) {
			return rateLimitResult;
		}
	}

	const { cinemaType, selectedCategories, specificDescriptors } = await request.json();

	const prompt = `You are knowledgeable about recommendations for ${cinemaType}. 
	Give me a list of 5 ${cinemaType} recommendations 
	${selectedCategories ? 'that fit all of the following categories: ' + selectedCategories : ''}. ${
		specificDescriptors
			? 'Make sure it fits the following description as well: ' + specificDescriptors + '.'
			: ''
	} ${
		selectedCategories || specificDescriptors
			? 'If you do not have 5 recommendations that fit these criteria perfectly, do your best to suggest other ' +
			  cinemaType +
			  "'s that I might like."
			: ''
	} Please return this response as a numbered list with the ${cinemaType}'s title, followed by a colon, and then a brief description of the ${cinemaType}. 
	There should be a line of whitespace between each item in the list.Im looking for some recommendations for ${cinemaType}. 
	I like ${selectedCategories} maybe something that fits more this description: ${specificDescriptors}`;

	const response = await openai.completions.create({
		model: 'gpt-3.5-turbo-instruct',
		stream: true,
		temperature: 0.7,
		max_tokens: 2048,
		top_p: 1.0,
		frequency_penalty: 0.0,
		presence_penalty: 0.0,
		n: 1,
		prompt
	});
	const stream = OpenAIStream(response);
	return new StreamingTextResponse(stream);
};
