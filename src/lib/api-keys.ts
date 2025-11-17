// ABOUTME: Manages API keys with priority: user-provided keys (from request headers) > server-side keys (from environment)
// ABOUTME: Provides utilities to extract user keys from requests and select appropriate keys for API calls

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

  return {
    moondream: headers.get('x-moondream-key') || undefined,
    openrouter: headers.get('x-openrouter-key') || undefined,
    openai: headers.get('x-openai-key') || undefined,
  };
}

/**
 * Returns the appropriate API key based on priority: user key > server key
 * Logs which key source is being used without revealing the key value
 */
export function getApiKey(
  userKey: string | undefined,
  serverKey: string | undefined,
  keyName: string
): string | undefined {
  if (userKey && userKey.trim() !== '') {
    console.log(`Using user-provided ${keyName} key`);
    return userKey;
  }

  if (serverKey) {
    console.log(`Using server-side ${keyName} key`);
    return serverKey;
  }

  console.log(`No ${keyName} key available`);
  return undefined;
}

/**
 * Gets the appropriate OpenAI-compatible provider with key priority
 * Priority: OpenRouter (user > server) > OpenAI (user > server)
 * Returns { provider: 'openrouter' | 'openai', apiKey: string } or null if no keys available
 */
export function getAIProvider(
  userKeys: ApiKeys,
  serverOpenRouterKey: string | undefined,
  serverOpenAIKey: string | undefined
): { provider: 'openrouter' | 'openai'; apiKey: string } | null {
  // Try OpenRouter first (user key, then server key)
  const openrouterKey = getApiKey(userKeys.openrouter, serverOpenRouterKey, 'OpenRouter');
  if (openrouterKey) {
    return { provider: 'openrouter', apiKey: openrouterKey };
  }

  // Fall back to OpenAI (user key, then server key)
  const openaiKey = getApiKey(userKeys.openai, serverOpenAIKey, 'OpenAI');
  if (openaiKey) {
    return { provider: 'openai', apiKey: openaiKey };
  }

  // If neither available, return null
  console.log('No OpenRouter or OpenAI key available');
  return null;
}
