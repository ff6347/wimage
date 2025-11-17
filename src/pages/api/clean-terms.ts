// ABOUTME: API route for cleaning extracted terms using OpenAI
// ABOUTME: Converts plural to singular and reduces multi-word phrases to single best word for Wikipedia

import type { APIRoute } from "astro";
import OpenAI from "openai";
import {
	validateOrigin,
	createCorsErrorResponse,
	checkRateLimit,
	getClientId,
	createRateLimitErrorResponse,
} from "../../lib/cors";
import { observationsSchema } from "../../lib/json-schema";
import { SMALL_MODEL } from "../../lib/constants";
import { extractUserKeys, getAIProvider } from "../../lib/api-keys";
import { createOpenAI } from "@ai-sdk/openai";

interface CleanTermsRequest {
	items: string[];
}

interface CleanTermsResponse {
	items: string[];
}

const SYSTEM_PROMPT = `You clean up terms for Wikipedia lookup. Rules:
- Convert plural to singular (e.g., "curtains" -> "curtain")
- Reduce multi-word phrases to the single most relevant word for Wikipedia (e.g., "pink wall" -> "wall" or "pink", whichever makes more sense)
- Keep proper nouns as-is
- Return ONLY a JSON object with an "items" array of cleaned terms
- Maintain the same order as input`;

export const GET: APIRoute = async () => {
	return new Response(
		JSON.stringify({
			endpoint: "/api/clean-terms",
			description: "Cleans extracted terms for Wikipedia lookup using OpenAI",
			method: "POST",
			model: SMALL_MODEL,
			systemPrompt: SYSTEM_PROMPT,
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

		const providerInfo = getAIProvider(userKeys, serverOpenRouterKey, serverOpenAIKey);

		if (!providerInfo) {
			return new Response(
				JSON.stringify({ error: "No API keys configured (need OpenRouter or OpenAI)" }),
				{ status: 500, headers: { "Content-Type": "application/json" } }
			);
		}

		const body = await request.json();
		const data = body as CleanTermsRequest;

		if (!Array.isArray(data.items) || data.items.length === 0) {
			return new Response(
				JSON.stringify({ error: "No valid items provided" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		const openai = new OpenAI({
			apiKey: providerInfo.apiKey,
			...(providerInfo.provider === 'openrouter' && {
				baseURL: 'https://openrouter.ai/api/v1'
			})
		});

		const completion = await openai.chat.completions.create({
			model: SMALL_MODEL,
			messages: [
				{
					role: "system",
					content: SYSTEM_PROMPT,
				},
				{
					role: "user",
					content: `Clean these terms: ${JSON.stringify(data.items)}`,
				},
			],
			response_format: observationsSchema,
		});

		const resultText = completion.choices[0]?.message?.content;
		if (!resultText) {
			return new Response(
				JSON.stringify({ error: "No response from OpenAI" }),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}

		const result = JSON.parse(resultText) as CleanTermsResponse;

		return new Response(
			JSON.stringify({
				success: true,
				data: result,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Error cleaning terms:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to clean terms",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};
