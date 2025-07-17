import { z } from "zod";
import { BucketeerClient } from "../api/client.js";
import { config, getEnvironmentId } from "../config.js";
import { logger } from "../utils/logger.js";
import type { ListFeaturesRequest } from "../types/bucketeer.js";

// Input schema for the list-flags tool
export const listFlagsSchema = z.object({
	environmentId: z.string().optional(),
	pageSize: z.number().min(1).max(100).optional().default(20),
	cursor: z.string().optional(),
	tags: z.array(z.string()).optional(),
	orderBy: z.enum(["CREATED_AT", "UPDATED_AT", "NAME"]).optional(),
	orderDirection: z.enum(["ASC", "DESC"]).optional(),
	searchKeyword: z.string().optional(),
	maintainer: z.string().optional(),
	archived: z.boolean().optional(),
});

export type ListFlagsInput = z.infer<typeof listFlagsSchema>;

export const listFlagsTool = {
	name: "listFeatureFlags",
	description: "List all feature flags in the specified environment",
	inputSchema: {
		type: "object" as const,
		properties: {
			environmentId: {
				type: "string",
				description: "Environment ID (uses default if not provided)",
			},
			pageSize: {
				type: "number",
				description: "Number of items per page (1-100)",
				default: 20,
			},
			cursor: {
				type: "string",
				description: "Pagination cursor for next page",
			},
			tags: {
				type: "array",
				items: { type: "string" },
				description: "Filter by tags",
			},
			orderBy: {
				type: "string",
				enum: ["CREATED_AT", "UPDATED_AT", "NAME"],
				description: "Field to order by",
			},
			orderDirection: {
				type: "string",
				enum: ["ASC", "DESC"],
				description: "Order direction",
			},
			searchKeyword: {
				type: "string",
				description: "Search keyword for feature name or ID",
			},
			maintainer: {
				type: "string",
				description: "Filter by maintainer email",
			},
			archived: {
				type: "boolean",
				description: "Filter by archived status",
			},
		},
	},
	handler: async (input: unknown) => {
		try {
			// Validate input
			const params = listFlagsSchema.parse(input);

			logger.debug("Listing feature flags", params);

			// Create API client
			const client = new BucketeerClient(
				config.bucketeerHost,
				config.bucketeerApiKey,
			);

			// Prepare request
			const request: ListFeaturesRequest = {
				environmentId: getEnvironmentId(params.environmentId),
				pageSize: params.pageSize,
				cursor: params.cursor,
				tags: params.tags,
				orderBy: params.orderBy,
				orderDirection: params.orderDirection,
				searchKeyword: params.searchKeyword,
				maintainer: params.maintainer,
				archived: params.archived,
			};

			// Make API call
			const response = await client.listFeatures(request);

			logger.info(
				`Successfully listed ${response.features.length} feature flags`,
			);

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(
							{
								success: true,
								features: response.features,
								cursor: response.cursor,
								totalCount: response.totalCount,
							},
							null,
							2,
						),
					},
				],
			};
		} catch (error) {
			logger.error("Failed to list feature flags", error);

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
