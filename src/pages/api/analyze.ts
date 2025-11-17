// ABOUTME: API route for analyzing images using Moondream vision AI
// ABOUTME: Accepts image data and query, returns detection results

import type { APIRoute } from "astro";
import {
	validateOrigin,
	createCorsErrorResponse,
	checkRateLimit,
	getClientId,
	createRateLimitErrorResponse,
} from "../../lib/cors";
import { extractUserKeys, getApiKey } from "../../lib/api-keys";

const QUERY_PROMPT =
	'write a description of what you see. Point out exactly three things in one word. I only want JSON output. Don\'t add any newlines make it as compact as possible. Make it an array ```ts type result:string[] = ["item 1", "item 2", "item 3"] ```';

export const GET: APIRoute = async () => {
	return new Response(
		JSON.stringify({
			endpoint: "/api/analyze",
			description: "Analyzes images using Moondream vision AI",
			method: "POST",
			query: QUERY_PROMPT,
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
		console.info("Starting image analysis request");

		// Access environment variables from runtime (Cloudflare Workers)
		const runtime = locals.runtime as { env?: { MOONDREAM_API_KEY?: string } };
		const userKeys = extractUserKeys(request);
		const serverKey =
			runtime?.env?.MOONDREAM_API_KEY || import.meta.env.MOONDREAM_API_KEY;
		const apiKey = getApiKey(userKeys.moondream, serverKey, "Moondream");

		if (!apiKey) {
			console.error("MOONDREAM_API_KEY not configured");
			return new Response(
				JSON.stringify({ error: "MOONDREAM_API_KEY not configured" }),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}

		console.info("Parsing form data");
		const formData = await request.formData();
		const imageFile = formData.get("image") as File;
		const query =
			'write a description of what you see. Point out exactly three things in one word. I only want JSON output. Don\'t add any newlines make it as compact as possible. Make it an array ```ts type result:string[] = ["item 1", "item 2", "item 3"] ```';

		if (!imageFile) {
			console.error("No image provided in form data");
			return new Response(JSON.stringify({ error: "No image provided" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		console.log(
			"Image file received:",
			imageFile.name,
			imageFile.type,
			imageFile.size,
		);

		if (!query) {
			console.error("No query provided");
			return new Response(JSON.stringify({ error: "No query provided" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		console.info("Converting image to base64");
		const arrayBuffer = await imageFile.arrayBuffer();

		// Convert ArrayBuffer to base64 (Cloudflare Workers compatible)
		const uint8Array = new Uint8Array(arrayBuffer);
		let binaryString = "";
		for (let i = 0; i < uint8Array.length; i++) {
			binaryString += String.fromCharCode(uint8Array[i]);
		}
		const base64Image = btoa(binaryString);

		console.info("Calling Moondream API directly");
		const moondreamResponse = await fetch("https://api.moondream.ai/v1/query", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Moondream-Auth": apiKey,
			},
			body: JSON.stringify({
				image_url: `data:image/jpeg;base64,${base64Image}`,
				question: query,
				stream: false,
			}),
		});

		if (!moondreamResponse.ok) {
			const errorText = await moondreamResponse.text();
			console.error(
				"Moondream API error:",
				moondreamResponse.status,
				errorText,
			);
			throw new Error(
				`Moondream API error: ${moondreamResponse.status} ${errorText}`,
			);
		}

		const moondreamData = await moondreamResponse.json();
		console.info("Successfully received result from Moondream");

		return new Response(JSON.stringify({ result: moondreamData.answer }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Error analyzing image:", error);
		console.error(
			"Error stack:",
			error instanceof Error ? error.stack : "No stack trace",
		);
		return new Response(
			JSON.stringify({
				error: "Failed to analyze image",
				details: error instanceof Error ? error.message : "Unknown error",
				stack: error instanceof Error ? error.stack : undefined,
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};
