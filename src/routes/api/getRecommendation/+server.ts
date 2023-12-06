import { createParser } from 'eventsource-parser';
import { OPENAI_API_KEY } from '$env/static/private';
import { kv } from '@vercel/kv';
import OpenAI from "openai";
import type {Stream} from "openai/streaming";

const key = OPENAI_API_KEY;

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY || ''
});

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
	const userIP = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip');
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

interface OpenAIStreamPayload {
	model: string;
	prompt: string;
	temperature: number;
	top_p: number;
	frequency_penalty: number;
	presence_penalty: number;
	max_tokens: number;
	stream: boolean;
	n: number;
}

async function OpenAIStream(payload: Stream<OpenAI.Chat.ChatCompletionChunk>) {
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();

	let counter = 0;

	const res = await fetch('https://api.openai.com/v1/completions', {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${key}`
		},
		method: 'POST',
		body: JSON.stringify(payload)
	});

	const stream = new ReadableStream({
		async start(controller) {
			function onParse(event: any) {
				if (event.type === 'event') {
					const data = event.data;
					// https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
					if (data === '[DONE]') {
						controller.close();
						return;
					}
					try {
						const json = JSON.parse(data);
						const text = json.choices[0].text;

						if (counter < 2 && (text.match(/\n/) || []).length) {
							// this is a prefix character (i.e., "\n\n"), do nothing
							return;
						}
						const queue = encoder.encode(text);
						controller.enqueue(queue);
						counter++;
					} catch (e) {
						controller.error(e);
					}
				}
			}

			// stream response (SSE) from OpenAI may be fragmented into multiple chunks
			// this ensures we properly read chunks and invoke an event for each SSE event stream
			const parser = createParser(onParse);
			// https://web.dev/streams/#asynchronous-iteration
			for await (const chunk of res.body as any) {
				parser.feed(decoder.decode(chunk));
			}
		}
	});
	return stream;
}

export async function POST({ request }: { request: any }) {
	// Apply rate limit middleware
	// const rateLimitResult = await rateLimitMiddleware(request);
	// if (rateLimitResult) {
	// 	return rateLimitResult;
	// }
	const { cinemaType, selectedCategories, specificDescriptors } = await request.json();
	const response = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		stream: true,
		temperature: 0.7,
		max_tokens: 2048,
		top_p: 1.0,
		frequency_penalty: 0.0,
		presence_penalty: 0.0,
		n: 1,
		messages: [
			{
				role: "system",
				content: `You are knowledgeable about recommendations for ${cinemaType}.`
			},
			{
				role: "system",
				content: `Give me a list of 5 ${cinemaType} recommendations ${
					selectedCategories ? `that fit all of the following categories: ${selectedCategories}` : ''
				}. ${
					specificDescriptors
						? `Make sure it fits the following description as well: ${specificDescriptors}.`
						: ''
				} ${
					selectedCategories || specificDescriptors
						? `If you do not have 5 recommendations that fit these criteria perfectly, do your best to suggest other ${cinemaType}'s that I might like.`
						: ''
				} Please return this response as a numbered list with the ${cinemaType}'s title, followed by a colon, and then a brief description of the ${cinemaType}. There should be a line of whitespace between each item in the list.`
			},
			{
				role: "user",
				content: `Im looking for some recommendations for ${cinemaType}. I like ${selectedCategories} 
				maybe something that fits more this description: ${specificDescriptors}`
			}
		]
	});
	const stream = await OpenAIStream(response);
	return new Response(stream);
}
