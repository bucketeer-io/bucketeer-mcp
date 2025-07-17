import { z } from "zod";
import { BucketeerClient } from "../api/client.js";
import { config, getEnvironmentId } from "../config.js";
import { logger } from "../utils/logger.js";
import type { GetFeatureRequest } from "../types/bucketeer.js";

// Input schema for the get-flag tool
export const getFlagSchema = z.object({
	id: z.string().min(1, "Feature flag ID is required"),
	environmentId: z.string().optional(),
	featureVersion: z.number().optional(),
});

export type GetFlagInput = z.infer<typeof getFlagSchema>;

export const getFlagTool = {
	name: "getFeatureFlag",
	description: "Get a specific feature flag by ID",
	inputSchema: {
		type: "object" as const,
		properties: {
			id: {
				type: "string",
				description: "The ID of the feature flag to retrieve",
			},
			environmentId: {
				type: "string",
				description: "Environment ID (uses default if not provided)",
			},
			featureVersion: {
				type: "number",
				description: "Specific version of the feature to retrieve",
			},
		},
		required: ["id"],
	},
	handler: async (input: unknown) => {
		try {
			// Validate input
			const params = getFlagSchema.parse(input);

			logger.debug("Getting feature flag", params);

			// Create API client
			const client = new BucketeerClient(
				config.bucketeerHost,
				config.bucketeerApiKey,
			);

			// Prepare request
			const request: GetFeatureRequest = {
				id: params.id,
				environmentId: getEnvironmentId(params.environmentId),
				featureVersion: params.featureVersion,
			};

			// Make API call
			const response = await client.getFeature(request);

			logger.info(
				`Successfully retrieved feature flag: ${response.feature.id}`,
			);

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
			logger.error("Failed to get feature flag", error);

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
