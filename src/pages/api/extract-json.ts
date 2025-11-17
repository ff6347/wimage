// ABOUTME: API route for extracting JSON from Moondream results using OpenAI
// ABOUTME: Accepts Moondream response text and uses GPT-5 Mini to parse it into structured JSON

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

const SYSTEM_PROMPT = `You are a JSON data extract tool. You get some text that should contain a JSON string. For example
'Results:
"[\n  "man",\n  "glasses",\n  "hoodie"\n]"'

Return them as an JSON array`;

export const GET: APIRoute = async () => {
	return new Response(
		JSON.stringify({
			endpoint: "/api/extract-json",
			description:
				"Extracts structured JSON from Moondream results using OpenAI",
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
		const moondreamResult = body.result;

		if (!moondreamResult || typeof moondreamResult !== "string") {
			return new Response(
				JSON.stringify({ error: "No valid result provided" }),
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
					content: moondreamResult,
				},
			],
			response_format: observationsSchema,
		});

		const extractedContent = completion.choices[0]?.message?.content;

		if (!extractedContent) {
			return new Response(
				JSON.stringify({ error: "No content extracted from OpenAI" }),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}

		const parsed = JSON.parse(extractedContent);

		return new Response(
			JSON.stringify({
				success: true,
				data: parsed,
				rawResult: moondreamResult,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Error extracting JSON:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to extract JSON",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};
