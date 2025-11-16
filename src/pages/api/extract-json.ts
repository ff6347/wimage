// ABOUTME: API route for extracting JSON from Moondream results using OpenAI via Vercel AI SDK
// ABOUTME: Accepts Moondream response text and uses GPT-5 Mini to parse it into structured JSON

import type { APIRoute } from "astro";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import {
	validateOrigin,
	createCorsErrorResponse,
	checkRateLimit,
	getClientId,
	createRateLimitErrorResponse,
} from "../../lib/cors";
import { SMALL_MODEL } from "../../lib/constants";

// Zod schema for structured output validation matching original observationsSchema
const extractJsonSchema = z.object({
	items: z
		.array(z.string())
		.min(0)
		.max(3)
		.describe("Array of extracted observations from the image (0-3 items)"),
});

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
		const moondreamResult = body.result;

		if (!moondreamResult || typeof moondreamResult !== "string") {
			return new Response(
				JSON.stringify({ error: "No valid result provided" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Create OpenAI provider instance with API key
		const openai = createOpenAI({
			apiKey: openaiKey,
		});

		const { object } = await generateObject({
			model: openai(SMALL_MODEL),
			schema: extractJsonSchema,
			system: SYSTEM_PROMPT,
			prompt: moondreamResult,
		});

		if (!object || !object.items) {
			return new Response(
				JSON.stringify({ error: "No content extracted from OpenAI" }),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}

		return new Response(
			JSON.stringify({
				success: true,
				data: object,
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
