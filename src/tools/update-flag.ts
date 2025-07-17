import { z } from "zod";
import { BucketeerClient } from "../api/client.js";
import { config, getEnvironmentId } from "../config.js";
import { logger } from "../utils/logger.js";
import type { UpdateFeatureRequest } from "../types/bucketeer.js";

// Input schema for the update-flag tool
export const updateFlagSchema = z
	.object({
		id: z.string().min(1, "Feature flag ID is required"),
		comment: z.string().min(1, "Comment is required for all updates"),
		environmentId: z.string().optional(),
		name: z.string().optional(),
		description: z.string().optional(),
		tags: z.array(z.string()).optional(),
		enabled: z.boolean().optional(),
		archived: z.boolean().optional(),
	})
	.refine(
		(data) => {
			// At least one update field must be provided
			return (
				data.name !== undefined ||
				data.description !== undefined ||
				data.tags !== undefined ||
				data.enabled !== undefined ||
				data.archived !== undefined
			);
		},
		{ message: "At least one field to update must be provided" },
	);

export type UpdateFlagInput = z.infer<typeof updateFlagSchema>;

export const updateFlagTool = {
	name: "updateFeatureFlag",
	description: "Update an existing feature flag",
	inputSchema: {
		type: "object" as const,
		properties: {
			id: {
				type: "string",
				description: "The ID of the feature flag to update",
			},
			comment: {
				type: "string",
				description: "Comment for the update (required for audit trail)",
			},
			environmentId: {
				type: "string",
				description: "Environment ID (uses default if not provided)",
			},
			name: {
				type: "string",
				description: "New name for the feature flag",
			},
			description: {
				type: "string",
				description: "New description for the feature flag",
			},
			tags: {
				type: "array",
				items: { type: "string" },
				description: "New tags for the feature flag",
			},
			enabled: {
				type: "boolean",
				description: "Enable or disable the feature flag",
			},
			archived: {
				type: "boolean",
				description: "Archive or unarchive the feature flag",
			},
		},
		required: ["id", "comment"],
	},
	handler: async (input: unknown) => {
		try {
			// Validate input
			const params = updateFlagSchema.parse(input);

			logger.debug("Updating feature flag", params);

			// Create API client
			const client = new BucketeerClient(
				config.bucketeerHost,
				config.bucketeerApiKey,
			);

			// Prepare request
			const request: UpdateFeatureRequest = {
				id: params.id,
				comment: params.comment,
				environmentId: getEnvironmentId(params.environmentId),
			};

			// Only add fields that are being updated
			if (params.name !== undefined) {
				request.name = params.name;
			}
			if (params.description !== undefined) {
				request.description = params.description;
			}
			if (params.tags !== undefined) {
				request.tags = { values: params.tags };
			}
			if (params.enabled !== undefined) {
				request.enabled = params.enabled;
			}
			if (params.archived !== undefined) {
				request.archived = params.archived;
			}

			// Make API call
			const response = await client.updateFeature(request);

			logger.info(`Successfully updated feature flag: ${response.feature.id}`);

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(
							{
								success: true,
								feature: response.feature,
								updated: {
									...(params.name !== undefined && { name: params.name }),
									...(params.description !== undefined && {
										description: params.description,
									}),
									...(params.tags !== undefined && { tags: params.tags }),
									...(params.enabled !== undefined && {
										enabled: params.enabled,
									}),
									...(params.archived !== undefined && {
										archived: params.archived,
									}),
								},
							},
							null,
							2,
						),
					},
				],
			};
		} catch (error) {
			logger.error("Failed to update feature flag", error);

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
