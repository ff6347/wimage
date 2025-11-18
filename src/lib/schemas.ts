// ABOUTME: Shared Zod schemas used across API routes
// ABOUTME: Provides common validation schemas for structured outputs

import { z } from "zod";

export const stringItemsSchema = z.object({
	items: z.array(z.string())
		.length(3)
		.describe("Exactly three observations from the image"),
});

export type StringItems = z.infer<typeof stringItemsSchema>;
