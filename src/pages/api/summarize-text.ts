// ABOUTME: API route for summarizing Wikipedia text using OpenAI via Vercel AI SDK
// ABOUTME: Accepts Wikipedia article text and extracts key facts into two short sentences

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
import { LARGE_MODEL } from "../../lib/constants";

interface SummaryRequest {
	title: string;
	text: string;
}

interface SummaryResult {
	title: string;
	summary: string;
	error?: string;
}

const SYSTEM_PROMPT =
	"You are a helpful assistant that extracts key facts from Wikipedia articles. Summarize 5 most important sections of each of the articles into exactly one short, clear sentences that capture the most important information. Be concise and informative. Then create a new Wikipedia article based on the content. Keep it short as the goal is to provide a quick overview. Return ONLY the summary text without any additional commentary.";

export const GET: APIRoute = async () => {
	return new Response(
		JSON.stringify({
			endpoint: "/api/summarize-text",
			description: "Summarizes Wikipedia articles using OpenAI",
			method: "POST",
			model: LARGE_MODEL,
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
		const articles = body.articles;

		if (!Array.isArray(articles) || articles.length === 0) {
			return new Response(
				JSON.stringify({ error: "No valid articles provided" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Create OpenAI provider instance with API key
		const openai = createOpenAI({
			apiKey: openaiKey,
		});

		const results: SummaryResult[] = await Promise.all(
			articles.map(async (article: SummaryRequest) => {
				if (!article.text || !article.title) {
					return {
						title: article.title || "Unknown",
						summary: "",
						error: "Missing text or title",
					};
				}

				try {
					const { text } = await generateText({
						model: openai(LARGE_MODEL),
						system: SYSTEM_PROMPT,
						messages: [
							{
								role: "user",
								content: `Article title: ${article.title}\n\nArticle text:\n${article.text}`,
							},
						],
						// maxTokens: 1000,
					});

					console.log(
						`Completion response for "${article.title}":`,
						text,
					);

					const summary = text || "No summary generated";

					if (!summary || summary === "No summary generated") {
						console.error(
							`Empty summary for "${article.title}". Full response:`,
							text,
						);
					}

					return {
						title: article.title,
						summary: summary.trim(),
					};
				} catch (error) {
					console.error(`Error summarizing "${article.title}":`, error);
					return {
						title: article.title,
						summary: "",
						error: error instanceof Error ? error.message : "Unknown error",
					};
				}
			}),
		);

		return new Response(
			JSON.stringify({
				success: true,
				results,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Error summarizing text:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to summarize text",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};
