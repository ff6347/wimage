// ABOUTME: API route for streaming Wikipedia text summarization using OpenAI via Vercel AI SDK
// ABOUTME: Accepts a single Wikipedia article and streams the summary in real-time

import type { APIRoute } from "astro";
import { streamText } from "ai";
import {
	validateOrigin,
	createCorsErrorResponse,
	checkRateLimit,
	getClientId,
	createRateLimitErrorResponse,
} from "../../lib/cors";
import { LARGE_MODEL } from "../../lib/constants";
import { extractUserKeys, getAIProviderInstance } from "../../lib/api-keys";

interface StreamSummaryRequest {
	title: string;
	text: string;
}

const SYSTEM_PROMPT =
	"You are a helpful assistant that extracts key facts from Wikipedia articles. Summarize 3 most important sections of the article into exactly one short, clear sentence each that captures the most important information. Be concise and informative. Then create a new Wikipedia article based on the content. Keep it short as the goal is to provide a quick overview. Return ONLY the summary text without any additional commentary.";

export const GET: APIRoute = async () => {
	return new Response(
		JSON.stringify({
			endpoint: "/api/summarize-stream",
			description:
				"Streams Wikipedia article summaries using OpenAI via Vercel AI SDK",
			method: "POST",
			model: LARGE_MODEL,
			systemPrompt: SYSTEM_PROMPT,
			streaming: true,
		}),
		{ status: 200, headers: { "Content-Type": "application/json" } },
	);
};

export const POST: APIRoute = async ({ request, locals }) => {
	if (!validateOrigin(request)) {
		return createCorsErrorResponse();
	}

	const clientId = getClientId(request);
	if (!checkRateLimit(clientId)) {
		return createRateLimitErrorResponse();
	}

	try {
		const userKeys = extractUserKeys(request);
		const runtime = locals.runtime as { env?: { OPENROUTER_API_KEY?: string; OPENAI_API_KEY?: string } };
		const serverOpenRouterKey = runtime?.env?.OPENROUTER_API_KEY || import.meta.env.OPENROUTER_API_KEY;
		const serverOpenAIKey = runtime?.env?.OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;

		const providerInstance = getAIProviderInstance(userKeys, serverOpenRouterKey, serverOpenAIKey);

		if (!providerInstance) {
			return new Response(
				JSON.stringify({ error: "No API keys configured (need OpenRouter or OpenAI)" }),
				{ status: 500, headers: { "Content-Type": "application/json" } }
			);
		}

		const body = await request.json();
		const article = body.article as StreamSummaryRequest;

		if (!article || !article.text || !article.title) {
			return new Response(
				JSON.stringify({ error: "Missing article title or text" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Create the streaming text response
		const result = streamText({
			model: providerInstance.provider.chat(LARGE_MODEL),
			system: SYSTEM_PROMPT,
			messages: [
				{
					role: "user",
					content: `Article title: ${article.title}\n\nArticle text:\n${article.text}`,
				},
			],
		});

		// Return the streaming response
		return result.toTextStreamResponse();
	} catch (error) {
		console.error("Error streaming summary:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to stream summary",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};
