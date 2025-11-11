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

interface CleanTermsRequest {
	items: string[];
}

interface CleanTermsResponse {
	cleaned: string[];
}

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

		const openai = new OpenAI({ apiKey: openaiKey });

		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content: `You clean up terms for Wikipedia lookup. Rules:
- Convert plural to singular (e.g., "curtains" -> "curtain")
- Reduce multi-word phrases to the single most relevant word for Wikipedia (e.g., "pink wall" -> "wall" or "pink", whichever makes more sense)
- Keep proper nouns as-is
- Return ONLY a JSON array of cleaned terms, no explanations
- Maintain the same order as input`,
				},
				{
					role: "user",
					content: `Clean these terms: ${JSON.stringify(data.items)}`,
				},
			],
			response_format: { type: "json_object" },
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
				cleaned: result.cleaned || result,
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
