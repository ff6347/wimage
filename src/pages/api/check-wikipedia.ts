// ABOUTME: API route for checking Wikipedia articles for extracted items
// ABOUTME: Accepts array of terms and queries Wikipedia MediaWiki API to check if articles exist

import type { APIRoute } from "astro";
import { validateOrigin, createCorsErrorResponse, checkRateLimit, getClientId, createRateLimitErrorResponse } from "../../lib/cors";

interface WikipediaPage {
	pageid?: number;
	title: string;
	missing?: boolean;
}

interface WikipediaCheckResult {
	term: string;
	exists: boolean;
	pageId?: number;
	url?: string;
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
		const body = await request.json();
		const items = body.items;

		if (!Array.isArray(items) || items.length === 0) {
			return new Response(
				JSON.stringify({ error: "No valid items provided" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Check each item against Wikipedia
		const results: WikipediaCheckResult[] = await Promise.all(
			items.map(async (item: string) => {
				const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(item)}&format=json&origin=*`;

				try {
					const response = await fetch(url);
					const data = await response.json();
					console.log(JSON.stringify(data, null, 2));
					const pages = data.query.pages;
					const pageId = Object.keys(pages)[0];
					const page: WikipediaPage = pages[pageId];

					const exists = pageId !== "-1" && !page.missing;

					return {
						term: item,
						exists,
						pageId: exists ? page.pageid : undefined,
						url: exists
							? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`
							: undefined,
					};
				} catch (error) {
					console.error(`Error checking Wikipedia for "${item}":`, error);
					return {
						term: item,
						exists: false,
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
		console.error("Error checking Wikipedia:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to check Wikipedia",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};
