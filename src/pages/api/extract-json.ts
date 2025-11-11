// ABOUTME: API route for extracting JSON from Moondream results using OpenAI
// ABOUTME: Accepts Moondream response text and uses GPT-4o Mini to parse it into structured JSON

import type { APIRoute } from "astro";
import OpenAI from "openai";
import { validateOrigin, createCorsErrorResponse, checkRateLimit, getClientId, createRateLimitErrorResponse } from "../../lib/cors";

const SYSTEM_PROMPT = "Extract exactly three items from the provided text describing what is observed in an image. Return them as an array of three strings.";

export const GET: APIRoute = async () => {
	return new Response(
		JSON.stringify({
			endpoint: "/api/extract-json",
			description: "Extracts structured JSON from Moondream results using OpenAI",
			method: "POST",
			model: "gpt-4o-mini",
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
		const openaiKey = runtime?.env?.OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;

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

		const openai = new OpenAI({ apiKey: openaiKey });

		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
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
			response_format: {
				type: "json_schema",
				json_schema: {
					name: "image_observations",
					strict: true,
					schema: {
						type: "object",
						properties: {
							items: {
								type: "array",
								items: {
									type: "string",
								},
								minItems: 3,
								maxItems: 3,
								description: "Exactly three observations from the image",
							},
						},
						required: ["items"],
						additionalProperties: false,
					},
				},
			},
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
