// ABOUTME: API route for fetching full Wikipedia article text
// ABOUTME: Accepts Wikipedia URLs and returns extracted plain text content

import type { APIRoute } from "astro";
import { validateOrigin, createCorsErrorResponse, checkRateLimit, getClientId, createRateLimitErrorResponse } from "../../lib/cors";

interface WikipediaPage {
	pageid?: number;
	title?: string;
	extract?: string;
}

interface WikipediaTextResult {
	url: string;
	title?: string;
	text?: string;
	preview?: string;
	error?: string;
}

const wikiUrlToApiUrl = (url: string): string | null => {
	try {
		const u = new URL(url);
		if (!u.pathname.startsWith("/wiki/")) return null;
		const title = u.pathname.replace("/wiki/", "");
		const wikiUrl = `${u.origin}/w/api.php?action=query&prop=extracts&titles=${encodeURIComponent(title)}&format=json&explaintext=true&origin=*`;
		return wikiUrl;
	} catch {
		return null;
	}
};

export const POST: APIRoute = async ({ request }) => {
	if (!validateOrigin(request)) {
		return createCorsErrorResponse();
	}

	const clientId = getClientId(request);
	if (!checkRateLimit(clientId)) {
		return createRateLimitErrorResponse();
	}

	try {
		const body = await request.json();
		const urls = body.urls;

		if (!Array.isArray(urls) || urls.length === 0) {
			return new Response(
				JSON.stringify({ error: "No valid URLs provided" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		const results: WikipediaTextResult[] = await Promise.all(
			urls.map(async (url: string) => {
				const apiUrl = wikiUrlToApiUrl(url);

				if (!apiUrl) {
					return {
						url,
						error: "Invalid Wikipedia URL format"
					};
				}

				try {
					const response = await fetch(apiUrl);
					const data = await response.json();

					const page: WikipediaPage = Object.values(data?.query?.pages || {})[0] as WikipediaPage;
					const fullText = page?.extract || "";

					if (!fullText) {
						return {
							url,
							title: page?.title,
							error: "No text content found"
						};
					}

					const preview = fullText.split("\n").slice(0, 5).join("\n");

					return {
						url,
						title: page.title,
						text: fullText,
						preview
					};
				} catch (error) {
					console.error(`Error fetching Wikipedia text for "${url}":`, error);
					return {
						url,
						error: error instanceof Error ? error.message : "Unknown error"
					};
				}
			})
		);

		return new Response(
			JSON.stringify({
				success: true,
				results
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" }
			}
		);
	} catch (error) {
		console.error("Error fetching Wikipedia text:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to fetch Wikipedia text",
				details: error instanceof Error ? error.message : "Unknown error"
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
};
