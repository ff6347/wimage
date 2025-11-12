// ABOUTME: Experimental streaming API for generating visualizations using Vercel AI SDK
// ABOUTME: Streams HTML generation in real-time for progressive rendering experiments

import type { APIRoute } from "astro";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
	validateOrigin,
	createCorsErrorResponse,
	checkRateLimit,
	getClientId,
	createRateLimitErrorResponse,
} from "../../lib/cors";

interface Summary {
	title: string;
	summary: string;
}

const SYSTEM_PROMPT = `You are an expert in expressive web typography and creative web design!

Requirements:
- Create a complete HTML document with DOCTYPE, head, and body
- Don't just use the text come up with a new creative content based on the summaries
-  Include all CSS inline in a <style> tag - no external stylesheets
-  Use creative spatial typography - vary font sizes, positions, rotations, and layouts
- You are specialized in generative typographic art.
- Use only one font but vary weights and sizes.
- Use absolute positioning for layout.
- No images or illustrations, only text-based design.
- Focus on experimental and artistic layouts.
- Avoid traditional article structures.
- Create unique, artistic HTML pages with experimental spatial layouts.
- No need to use all the text.
- Simplify and abstract the information to create a visual experience.
- Try do work on depth.

- Use reduced colors and high contrast. White background and expressive colors.
- Use the text to create a mixture of the information instead of just making it look like an article.
- NO ROUNDED CORNERS.
- VERY IMPORTANT! You always return complete, valid HTML documents.
- No illustration.
`;

export const GET: APIRoute = async () => {
	return new Response(
		JSON.stringify({
			endpoint: "/api/generate-visualization-stream",
			description: "Experimental streaming visualization generation using Vercel AI SDK",
			method: "POST",
			model: "gpt-4o",
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
		const summaries = body.summaries as Summary[];

		if (!summaries || summaries.length === 0) {
			return new Response(
				JSON.stringify({ error: "Missing summaries" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Format summaries for the prompt
		const formattedSummaries = summaries
			.map((s) => `Title: ${s.title}\nSummary: ${s.summary}`)
			.join("\n\n");

		// Create OpenAI provider instance with API key
		const openai = createOpenAI({
			apiKey: openaiKey,
		});

		// Create the streaming text response
		const result = streamText({
			model: openai("gpt-4o"),
			system: SYSTEM_PROMPT,
			messages: [
				{
					role: "user",
					content: `Create an expressive spatial typography visualization based on these Wikipedia summaries:\n\n${formattedSummaries}`,
				},
			],
		});

		// Return the streaming response
		return result.toTextStreamResponse();
	} catch (error) {
		console.error("Error streaming visualization:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to stream visualization",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};
