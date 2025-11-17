// ABOUTME: Experimental streaming API for generating visualizations using Vercel AI SDK
// ABOUTME: Streams HTML generation in real-time for progressive rendering experiments

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

interface Summary {
	title: string;
	summary: string;
}

const SYSTEM_PROMPT = `You are an expert in expressive web typography and creative web design that has internalized the laws of gestalt and color theory!

Remember Gestalt works are better when you consider:
- Proximity
- Similarity
- Continuity
- Closure
- Figure/Ground
- Symmetry & Order

Remember Colors are better when you consider:
- Contrast
- Saturation
- Hue
- Temperature
- Monochromatic vs Complementary
- Triadic
- Analogous
- Tetradic
- Split-Complementary
- Color Harmony

Requirements:
- Create a complete HTML document with DOCTYPE, head, and body
- Don't just use the text come up with a new creative content based on the summaries
-  Include all CSS inline in a <style> tag - no external stylesheets
-  Use creative spatial typography - vary font sizes, positions, rotations, and layouts
- You are specialized in generative typographic art.
- Use only one font but vary weights and sizes.
- Use absolute positioning for layout.
- NO images or illustrations, only text-based design.
- NO need to use all the text.
- Focus on experimental and artistic layouts.
- Avoid traditional article structures.
- Create unique, artistic HTML pages with experimental spatial layouts.
- Simplify and abstract the information to create a visual experience.
- Try do work on depth.

- White background and expressive colors. High contrast.
- Use the text to create a mixture of the information instead of just making it look like an article.
- NO ROUNDED CORNERS.
- VERY IMPORTANT! You always return complete, valid HTML documents.
- No illustration.
- CRITICAL: Return ONLY the raw HTML, no markdown code fences, no \`\`\`html wrapper, just the HTML starting with <!DOCTYPE html>
`;

export const GET: APIRoute = async () => {
	return new Response(
		JSON.stringify({
			endpoint: "/api/generate-visualization-stream",
			description:
				"Experimental streaming visualization generation using Vercel AI SDK",
			method: "POST",
			model: LARGE_MODEL,
			systemPrompt: SYSTEM_PROMPT,
			streaming: true,
		}),
		{ status: 200, headers: { "Content-Type": "application/json" } },
	);
};

export const POST: APIRoute = async ({ request, locals }) => {
	console.log("=== POST /api/generate-visualization-stream called ===");

	if (!validateOrigin(request)) {
		console.log("CORS validation failed");
		return createCorsErrorResponse();
	}

	const clientId = getClientId(request);
	if (!checkRateLimit(clientId)) {
		console.log("Rate limit exceeded");
		return createRateLimitErrorResponse();
	}

	console.log("Validation passed, processing request...");
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
		const summaries = body.summaries as Summary[];

		if (!summaries || summaries.length === 0) {
			return new Response(JSON.stringify({ error: "Missing summaries" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Format summaries for the prompt
		const formattedSummaries = summaries
			.map((s) => `Title: ${s.title}\nSummary: ${s.summary}`)
			.join("\n\n");

		// Create the streaming text response
		console.log(
			"Creating streaming visualization with summaries:",
			summaries.length,
		);
		console.log("Formatted summaries:", formattedSummaries.substring(0, 200));

		const result = streamText({
			model: providerInstance.provider.chat(LARGE_MODEL),
			system: SYSTEM_PROMPT,
			messages: [
				{
					role: "user",
					content: `Create an expressive spatial typography visualization based on these Wikipedia summaries:\n\n${formattedSummaries}`,
				},
			],
		});

		console.log("Returning streaming response...");
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
