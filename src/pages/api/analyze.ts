// ABOUTME: API route for analyzing images using Moondream vision AI
// ABOUTME: Accepts image data and query, returns detection results

import type { APIRoute } from "astro";
import { vl } from "moondream";

export const POST: APIRoute = async ({ request }) => {
	try {
		const apiKey = import.meta.env.MOONDREAM_API_KEY;

		if (!apiKey) {
			return new Response(
				JSON.stringify({ error: "MOONDREAM_API_KEY not configured" }),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}

		const formData = await request.formData();
		const imageFile = formData.get("image") as File;
		const query =
			'write a description of what you see. Point out exactly three things in one word. I only want JSON output. Don\'t add any newlines make it as compact as possible. Make it an array ```ts type result:string[] = ["item 1", "item 2", "item 3"] ```';

		if (!imageFile) {
			return new Response(JSON.stringify({ error: "No image provided" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (!query) {
			return new Response(JSON.stringify({ error: "No query provided" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const arrayBuffer = await imageFile.arrayBuffer();
		const imageBuffer = Buffer.from(arrayBuffer);

		const model = new vl({ apiKey });

		const base64Image = imageBuffer.toString("base64");
		const imageUrl = `data:image/jpeg;base64,${base64Image}`;

		const result = await model.query({
			image: { imageUrl },
			question: query,
			stream: false,
		});

		return new Response(JSON.stringify({ result }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Error analyzing image:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to analyze image",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};
