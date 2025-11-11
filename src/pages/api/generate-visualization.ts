// ABOUTME: API route for generating expressive spatial typography visualizations using OpenAI
// ABOUTME: Accepts summaries and uses GPT-4o-mini to create unique HTML/CSS for each visualization

import type { APIRoute } from "astro";
import OpenAI from "openai";
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
		const summaries = body.summaries;

		if (!Array.isArray(summaries) || summaries.length === 0) {
			return new Response(
				JSON.stringify({ error: "No valid summaries provided" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		const openai = new OpenAI({ apiKey: openaiKey });

		const summariesText = summaries
			.map((s: Summary) => `Title: ${s.title}\nSummary: ${s.summary}`)
			.join("\n\n");

		const prompt = `
Article Summaries:
${summariesText}
Return ONLY the complete HTML code, no explanations or markdown formatting.`;

		const completion = await openai.chat.completions.create({
			model: "gpt-5",
			messages: [
				{
					role: "system",
					content: `You are an expert in expressive web typography and creative web design!

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
`,
				},
				{
					role: "user",
					content: prompt,
				},
			],
			// temperature: 1.2,
			// max_completion_tokens: 4000,
		});

		let html = completion.choices[0]?.message?.content || "";

		if (!html) {
			return new Response(JSON.stringify({ error: "No HTML generated" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}

		html = html.trim();
		if (html.startsWith("```html")) {
			html = html.replace(/^```html\n/, "").replace(/\n```$/, "");
		} else if (html.startsWith("```")) {
			html = html.replace(/^```\n/, "").replace(/\n```$/, "");
		}

		return new Response(JSON.stringify({ success: true, html }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Error generating visualization:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to generate visualization",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};
