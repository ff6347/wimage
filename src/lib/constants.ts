export const SMALL_MODEL = "openai/gpt-5-mini";
export const LARGE_MODEL = "openai/gpt-5.1";

export type AIProviderName = "openrouter" | "openai";

export function modelIdForProvider(
	modelId: string,
	providerName: AIProviderName,
): string {
	if (providerName === "openai" && modelId.startsWith("openai/")) {
		return modelId.slice("openai/".length);
	}

	return modelId;
}
