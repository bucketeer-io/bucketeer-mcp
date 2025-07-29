import { z } from "zod";
import { BucketeerClient } from "../api/client.js";
import { config, getEnvironmentId } from "../config.js";
import { logger } from "../utils/logger.js";
import type { UpdateFeatureRequest } from "../types/bucketeer.js";

// Input schema for the archive-flag tool
export const archiveFlagSchema = z.object({
	id: z.string().min(1, "Feature flag ID is required"),
	environmentId: z.string().optional(),
	comment: z.string().min(1, "Comment is required for archiving"),
});

export type ArchiveFlagInput = z.infer<typeof archiveFlagSchema>;

export const archiveFlagTool = {
	name: "archiveFeatureFlag",
	description: "Archive a feature flag (make it inactive)",
	inputSchema: {
		type: "object" as const,
		properties: {
			id: {
				type: "string",
				description: "The ID of the feature flag to archive",
			},
			environmentId: {
				type: "string",
				description: "Environment ID (uses default if not provided)",
			},
			comment: {
				type: "string",
				description:
					"Comment for the archive action (required for audit trail)",
			},
		},
		required: ["id", "comment"],
	},
	handler: async (input: unknown) => {
		try {
			// Validate input
			const params = archiveFlagSchema.parse(input);

			logger.debug("Archiving feature flag", params);

			// Create API client
			const client = new BucketeerClient(
				config.bucketeerHost,
				config.bucketeerApiKey,
			);

			// Prepare request - use UpdateFeatureRequest with archived=true
			const request: UpdateFeatureRequest = {
				id: params.id,
				comment: params.comment,
				environmentId: getEnvironmentId(params.environmentId),
				archived: true,
			};

			// Make API call
			const response = await client.updateFeature(request);

			logger.info(`Successfully archived feature flag: ${params.id}`);

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(
							{
								success: true,
								message: `Feature flag '${params.id}' has been archived`,
								archivedId: params.id,
								feature: response.feature,
							},
							null,
							2,
						),
					},
				],
			};
		} catch (error) {
			logger.error("Failed to archive feature flag", error);

			if (error instanceof z.ZodError) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									success: false,
									error: "Invalid input parameters",
									details: error.issues,
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
