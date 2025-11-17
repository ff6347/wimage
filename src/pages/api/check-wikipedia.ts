// ABOUTME: API route for checking Wikipedia articles for extracted items
// ABOUTME: Accepts array of terms and queries Wikipedia MediaWiki API to check if articles exist

import type { APIRoute } from "astro";
import {
	validateOrigin,
	createCorsErrorResponse,
	checkRateLimit,
	getClientId,
	createRateLimitErrorResponse,
} from "../../lib/cors";

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

export const GET: APIRoute = async () => {
	return new Response(
		JSON.stringify({
			endpoint: "/api/check-wikipedia",
			description:
				"Checks if Wikipedia articles exist for given terms using the MediaWiki API. Queries the API with each term and returns URLs for articles that exist.",
			method: "POST",
			apiUsed: "Wikipedia MediaWiki API (opensearch action)",
		}),
		{ status: 200, headers: { "Content-Type": "application/json" } },
	);
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
					const response = await fetch(url, {
						headers: {
							"User-Agent":
								"WikiImageApp/1.0 (https://wimage.pages.dev; educational project)",
							Accept: "application/json",
						},
					});

					if (!response.ok) {
						console.error(
							`Wikipedia API error for "${item}": ${response.status} ${response.statusText}`,
						);
						const text = await response.text();
						console.error(`Response text: ${text.substring(0, 200)}`);
						return {
							term: item,
							exists: false,
							error: `Wikipedia API error: ${response.status}`,
						};
					}

					const contentType = response.headers.get("content-type");
					if (!contentType || !contentType.includes("application/json")) {
						const text = await response.text();
						console.error(
							`Non-JSON response for "${item}": ${text.substring(0, 200)}`,
						);
						return {
							term: item,
							exists: false,
							error: "Wikipedia API returned non-JSON response",
						};
					}

					const data = await response.json();
					console.info(
						`Wikipedia response for "${item}":`,
						JSON.stringify(data, null, 2),
					);

					const pages = data.query?.pages;
					if (!pages) {
						return {
							term: item,
							exists: false,
							error: "Invalid Wikipedia API response",
						};
					}

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
