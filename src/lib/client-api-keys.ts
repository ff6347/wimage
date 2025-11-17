// ABOUTME: Client-side utility for loading API keys from localStorage
// ABOUTME: Provides headers for API requests with user-configured keys

interface APIKeys {
	openrouter?: string;
	moondream?: string;
	openai?: string;
}

const STORAGE_KEY = "wimage_api_keys";

export function getApiHeaders(): HeadersInit {
	const headers: HeadersInit = {};

	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (!saved) {
			return headers;
		}

		const keys: APIKeys = JSON.parse(saved);

		if (keys.moondream) {
			headers["x-moondream-key"] = keys.moondream;
		}

		if (keys.openrouter) {
			headers["x-openrouter-key"] = keys.openrouter;
		}

		if (keys.openai) {
			headers["x-openai-key"] = keys.openai;
		}
	} catch (error) {
		console.error("Error loading API keys:", error);
	}

	return headers;
}
