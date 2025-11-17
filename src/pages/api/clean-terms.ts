// ABOUTME: API route for cleaning extracted terms using OpenAI via Vercel AI SDK
// ABOUTME: Converts plural to singular and reduces multi-word phrases to single best word for Wikipedia

import type { APIRoute } from "astro";
import { generateObject } from "ai";
import {
	validateOrigin,
	createCorsErrorResponse,
	checkRateLimit,
	getClientId,
	createRateLimitErrorResponse,
} from "../../lib/cors";
import { SMALL_MODEL } from "../../lib/constants";
import { extractUserKeys, getAIProviderInstance } from "../../lib/api-keys";
import { stringItemsSchema } from "../../lib/schemas";

interface CleanTermsRequest {
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
		const runtime = locals.runtime as {
			env?: { OPENROUTER_API_KEY?: string; OPENAI_API_KEY?: string };
		};
		const serverOpenRouterKey =
			runtime?.env?.OPENROUTER_API_KEY || import.meta.env.OPENROUTER_API_KEY;
		const serverOpenAIKey =
			runtime?.env?.OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;

		const providerInstance = getAIProviderInstance(
			userKeys,
			serverOpenRouterKey,
			serverOpenAIKey,
		);

		if (!providerInstance) {
			return new Response(
				JSON.stringify({
					error: "No API keys configured (need OpenRouter or OpenAI)",
				}),
				{ status: 500, headers: { "Content-Type": "application/json" } },
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

		const { object } = await generateObject({
			model: providerInstance.provider.chat(SMALL_MODEL),
			schema: stringItemsSchema,
			system: SYSTEM_PROMPT,
			prompt: `Clean these terms: ${JSON.stringify(data.items)}`,
		});

		if (!object || !object.items) {
			return new Response(
				JSON.stringify({ error: "No response from OpenAI" }),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}

		return new Response(
			JSON.stringify({
				success: true,
				data: object,
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
