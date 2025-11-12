import type { ResponseFormatJSONSchema } from "openai/resources";

export const observationsSchema: ResponseFormatJSONSchema = {
	type: "json_schema",
	json_schema: {
		name: "image_observations",
		strict: true,
		schema: {
			type: "object",
			properties: {
				items: {
					type: "array",
					items: {
						type: "string",
					},
					minItems: 0,
					maxItems: 3,
					description: "Exactly three observations from the image",
				},
			},
			required: ["items"],
			additionalProperties: false,
		},
	},
};
