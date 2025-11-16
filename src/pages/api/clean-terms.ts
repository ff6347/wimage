// ABOUTME: API route for cleaning extracted terms using OpenAI via Vercel AI SDK
// ABOUTME: Converts plural to singular and reduces multi-word phrases to single best word for Wikipedia

import type { APIRoute } from "astro";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
	validateOrigin,
	createCorsErrorResponse,
	checkRateLimit,
	getClientId,
	createRateLimitErrorResponse,
} from "../../lib/cors";
import { SMALL_MODEL } from "../../lib/constants";

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
		const runtime = locals.runtime as { env?: { OPENAI_API_KEY?: string } };
		const openaiKey =
			runtime?.env?.OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;

		if (!openaiKey) {
			return new Response(
				JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
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

		// Create OpenAI provider instance with API key
		const openai = createOpenAI({
			apiKey: openaiKey,
		});

		const { text } = await generateText({
			model: openai(SMALL_MODEL),
			system: SYSTEM_PROMPT,
			messages: [
				{
					role: "user",
					content: `Clean these terms: ${JSON.stringify(data.items)}`,
				},
			],
			output: "json",
		});

		if (!text) {
			return new Response(
				JSON.stringify({ error: "No response from OpenAI" }),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}

		const result = JSON.parse(text) as CleanTermsResponse;

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
