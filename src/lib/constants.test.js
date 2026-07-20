// ABOUTME: Verifies model IDs are formatted for each supported AI provider.
// ABOUTME: Prevents OpenRouter-qualified IDs from reaching the direct OpenAI API.

import assert from "node:assert/strict";
import test from "node:test";
import { modelIdForProvider } from "./constants.ts";

test("removes the OpenAI prefix for the direct OpenAI provider", () => {
	assert.equal(
		modelIdForProvider("openai/gpt-5-mini", "openai"),
		"gpt-5-mini",
	);
});

test("keeps the OpenAI prefix for OpenRouter", () => {
	assert.equal(
		modelIdForProvider("openai/gpt-5-mini", "openrouter"),
		"openai/gpt-5-mini",
	);
});

test("keeps an unqualified OpenAI model ID unchanged", () => {
	assert.equal(modelIdForProvider("gpt-5-mini", "openai"), "gpt-5-mini");
});
