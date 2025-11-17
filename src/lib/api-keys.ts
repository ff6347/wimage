// ABOUTME: Manages API keys with priority: user-provided keys (from request headers) > server-side keys (from environment)
// ABOUTME: Provides utilities to extract user keys from requests and select appropriate keys for API calls

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAI } from '@ai-sdk/openai';

export interface ApiKeys {
	moondream: string | undefined;
	openrouter: string | undefined;
	openai: string | undefined;
}

/**
 * Extracts user-provided API keys from request headers
 */
export function extractUserKeys(request: Request): ApiKeys {
	const headers = request.headers;

	const keys = {
		moondream: headers.get("x-moondream-key") || undefined,
		openrouter: headers.get("x-openrouter-key") || undefined,
		openai: headers.get("x-openai-key") || undefined,
	};

	const providedKeys = Object.entries(keys)
		.filter(([_, value]) => value)
		.map(([key, _]) => key);

	if (providedKeys.length > 0) {
		console.info(`[API Keys] User provided keys: ${providedKeys.join(", ")}`);
	} else {
		console.info("[API Keys] No user keys provided in headers");
	}

	return keys;
}

/**
 * Returns the appropriate API key based on priority: user key > server key
 * Logs which key source is being used without revealing the key value
 */
export function getApiKey(
	userKey: string | undefined,
	serverKey: string | undefined,
	keyName: string,
): string | undefined {
	if (userKey && userKey.trim() !== "") {
		console.info(`[API Keys] Using user-provided ${keyName} key`);
		return userKey;
	}

	if (serverKey) {
		console.info(`[API Keys] Using server-side ${keyName} key as fallback`);
		return serverKey;
	}

	console.info(`[API Keys] No ${keyName} key available`);
	return undefined;
}

/**
 * Gets the appropriate AI provider instance (OpenRouter or OpenAI) with key priority
 * Priority: OpenRouter (user > server) > OpenAI (user > server)
 * Returns { provider: LanguageModelV1, providerName: string } or null if no keys available
 */
export function getAIProviderInstance(
	userKeys: ApiKeys,
	serverOpenRouterKey: string | undefined,
	serverOpenAIKey: string | undefined
): { provider: any; providerName: string } | null {
	// Try OpenRouter first (user key, then server key)
	const openrouterKey = getApiKey(userKeys.openrouter, serverOpenRouterKey, 'OpenRouter');
	if (openrouterKey) {
		console.log(`[API Keys] Selected provider: OpenRouter`);
		return {
			provider: createOpenRouter({ apiKey: openrouterKey }),
			providerName: 'openrouter'
		};
	}

	// Fall back to OpenAI (user key, then server key)
	const openaiKey = getApiKey(userKeys.openai, serverOpenAIKey, 'OpenAI');
	if (openaiKey) {
		console.log(`[API Keys] Selected provider: OpenAI (OpenRouter not available)`);
		return {
			provider: createOpenAI({ apiKey: openaiKey }),
			providerName: 'openai'
		};
	}

	// If neither available, return null
	console.log('[API Keys] No OpenRouter or OpenAI key available');
	return null;
}

/**
 * @deprecated Use getAIProviderInstance instead - this function returns metadata only, not the actual provider instance
 * Gets the appropriate OpenAI-compatible provider with key priority
 * Priority: OpenRouter (user > server) > OpenAI (user > server)
 * Returns { provider: 'openrouter' | 'openai', apiKey: string } or null if no keys available
 */
export function getAIProvider(
	userKeys: ApiKeys,
	serverOpenRouterKey: string | undefined,
	serverOpenAIKey: string | undefined,
): { provider: "openrouter" | "openai"; apiKey: string } | null {
	// Try OpenRouter first (user key, then server key)
	const openrouterKey = getApiKey(
		userKeys.openrouter,
		serverOpenRouterKey,
		"OpenRouter",
	);
	if (openrouterKey) {
		console.info(`[API Keys] Selected provider: OpenRouter`);
		return { provider: "openrouter", apiKey: openrouterKey };
	}

	// Fall back to OpenAI (user key, then server key)
	const openaiKey = getApiKey(userKeys.openai, serverOpenAIKey, "OpenAI");
	if (openaiKey) {
		console.info(
			`[API Keys] Selected provider: OpenAI (OpenRouter not available)`,
		);
		return { provider: "openai", apiKey: openaiKey };
	}

	// If neither available, return null
	console.info("[API Keys] No OpenRouter or OpenAI key available");
	return null;
}
