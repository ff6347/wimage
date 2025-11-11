// ABOUTME: API route for generating expressive spatial typography visualizations using OpenAI
// ABOUTME: Accepts summaries and uses GPT-4o-mini to create unique HTML/CSS for each visualization

import type { APIRoute } from "astro";
import OpenAI from "openai";
import { validateOrigin, createCorsErrorResponse, checkRateLimit, getClientId, createRateLimitErrorResponse } from "../../lib/cors";

interface Summary {
	title: string;
	summary: string;
}

export const POST: APIRoute = async ({ request }) => {
	if (!validateOrigin(request)) {
		return createCorsErrorResponse();
	}

	const clientId = getClientId(request);
	if (!checkRateLimit(clientId)) {
		return createRateLimitErrorResponse();
	}

	try {
		const openaiKey = import.meta.env.OPENAI_API_KEY;

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

		const prompt = `Create a complete, self-contained HTML page with expressive spatial typography to display these article summaries. The design should be unique and creative each time.

Article Summaries:
${summariesText}

Requirements:
1. Create a complete HTML document with DOCTYPE, head, and body
2. Include all CSS inline in a <style> tag - no external stylesheets
3. Use creative spatial typography - vary font sizes, positions, rotations, and layouts
4. Make each title and summary visually distinct with different positioning
5. Use vibrant colors, gradients, and modern design
6. Add animations and transitions for visual interest
7. Make it responsive
8. Be experimental with layout - don't use standard grids or boring layouts
9. Use transforms, absolute positioning, flexbox creatively
10. Include hover effects and interactive elements
11. Make sure all text is readable despite creative positioning
12. Use different font weights, letter spacing, and line heights for emphasis
13. The design should feel like art, not a standard webpage

Return ONLY the complete HTML code, no explanations or markdown formatting.`;

		const completion = await openai.chat.completions.create({
			model: "gpt-5",
			messages: [
				{
					role: "system",
					content:
						"You are an expert in expressive web typography and creative web design. You are specialized in generative typographic art. Use diffenrent fonts like.```css	/* Rounded Sans */ \nfont-family: ui-rounded, 'Hiragino Maru Gothic ProN', Quicksand, Comfortaa,Manjari, 'Arial Rounded MT', 'Arial Rounded MT Bold', Calibri, source-sans-pro, sans-serif;\nfont-weight: normal; ```\n You create unique, artistic HTML pages with experimental spatial layouts. You always return complete, valid HTML documents. Use reduced colors and high contrast. Dont try to just create an article. Think of it more like an expressive spatial image. Black and white with a pop of color is good. No illustration. Use the text to create a mixture of the information instead of just making it look like an article.",
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
