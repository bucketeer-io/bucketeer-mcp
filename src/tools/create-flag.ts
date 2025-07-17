import { z } from "zod";
import { BucketeerClient } from "../api/client.js";
import { config, getEnvironmentId } from "../config.js";
import { logger } from "../utils/logger.js";
import type { CreateFeatureRequest } from "../types/bucketeer.js";
import { VariationType } from "../types/bucketeer.js";

// Variation schema
const variationSchema = z.object({
	value: z.string().min(1, "Variation value is required"),
	name: z.string().min(1, "Variation name is required"),
	description: z.string().optional().default(""),
});

// Input schema for the create-flag tool
export const createFlagSchema = z.object({
	id: z
		.string()
		.min(1, "Feature flag ID is required")
		.regex(
			/^[a-zA-Z0-9-_]+$/,
			"ID must contain only alphanumeric characters, hyphens, and underscores",
		),
	name: z.string().min(1, "Feature flag name is required"),
	description: z.string().optional().default(""),
	environmentId: z.string().optional(),
	variations: z
		.array(variationSchema)
		.min(2, "At least 2 variations are required"),
	tags: z.array(z.string()).optional(),
	defaultOnVariationIndex: z.number().min(0),
	defaultOffVariationIndex: z.number().min(0),
	variationType: z
		.nativeEnum(VariationType)
		.optional()
		.default(VariationType.STRING),
});

export type CreateFlagInput = z.infer<typeof createFlagSchema>;

export const createFlagTool = {
	name: "createFeatureFlag",
	description: "Create a new feature flag in the specified environment",
	inputSchema: {
		type: "object" as const,
		properties: {
			id: {
				type: "string",
				description:
					"Unique identifier for the feature flag (alphanumeric, hyphens, underscores)",
			},
			name: {
				type: "string",
				description: "Human-readable name for the feature flag",
			},
			description: {
				type: "string",
				description: "Description of the feature flag",
			},
			environmentId: {
				type: "string",
				description: "Environment ID (uses default if not provided)",
			},
			variations: {
				type: "array",
				description: "List of variations (at least 2 required)",
				items: {
					type: "object",
					properties: {
						value: {
							type: "string",
							description: "The value returned when this variation is served",
						},
						name: {
							type: "string",
							description: "Name of the variation",
						},
						description: {
							type: "string",
							description: "Description of the variation",
						},
					},
					required: ["value", "name"],
				},
			},
			tags: {
				type: "array",
				items: { type: "string" },
				description: "Tags for the feature flag",
			},
			defaultOnVariationIndex: {
				type: "number",
				description:
					"Index of the variation to serve when flag is on (0-based)",
			},
			defaultOffVariationIndex: {
				type: "number",
				description:
					"Index of the variation to serve when flag is off (0-based)",
			},
			variationType: {
				type: "string",
				enum: ["STRING", "BOOLEAN", "NUMBER", "JSON"],
				description: "Type of the variation values (default: STRING)",
			},
		},
		required: [
			"id",
			"name",
			"variations",
			"defaultOnVariationIndex",
			"defaultOffVariationIndex",
		],
	},
	handler: async (input: unknown) => {
		try {
			// Validate input
			const params = createFlagSchema.parse(input);

			// Validate variation indices
			if (params.defaultOnVariationIndex >= params.variations.length) {
				throw new Error(
					`defaultOnVariationIndex ${params.defaultOnVariationIndex} is out of bounds. Must be less than ${params.variations.length}`,
				);
			}
			if (params.defaultOffVariationIndex >= params.variations.length) {
				throw new Error(
					`defaultOffVariationIndex ${params.defaultOffVariationIndex} is out of bounds. Must be less than ${params.variations.length}`,
				);
			}

			logger.debug("Creating feature flag", params);

			// Create API client
			const client = new BucketeerClient(
				config.bucketeerHost,
				config.bucketeerApiKey,
			);

			// Prepare request
			const request: CreateFeatureRequest = {
				id: params.id,
				name: params.name,
				description: params.description,
				environmentId: getEnvironmentId(params.environmentId),
				variations: params.variations,
				tags: params.tags,
				defaultOnVariationIndex: params.defaultOnVariationIndex,
				defaultOffVariationIndex: params.defaultOffVariationIndex,
				variationType: params.variationType,
			};

			// Make API call
			const response = await client.createFeature(request);

			logger.info(`Successfully created feature flag: ${response.feature.id}`);

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(
							{
								success: true,
								feature: response.feature,
							},
							null,
							2,
						),
					},
				],
			};
		} catch (error) {
			logger.error("Failed to create feature flag", error);

			if (error instanceof z.ZodError) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									success: false,
									error: "Invalid input parameters",
									details: error.errors,
								},
								null,
								2,
							),
						},
					],
					isError: true,
				};
			}

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(
							{
								success: false,
								error: error instanceof Error ? error.message : "Unknown error",
							},
							null,
							2,
						),
					},
				],
				isError: true,
			};
		}
	},
};
