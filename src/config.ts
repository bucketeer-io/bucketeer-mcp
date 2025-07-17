import { config as dotenvConfig } from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenvConfig();

// Configuration schema
const ConfigSchema = z.object({
	bucketeerHost: z.string().min(1, "BUCKETEER_HOST is required"),
	bucketeerApiKey: z.string().min(1, "BUCKETEER_API_KEY is required"),
	bucketeerEnvironmentId: z.string().optional(),
	logLevel: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

export type Config = z.infer<typeof ConfigSchema>;

// Load and validate configuration
function loadConfig(): Config {
	try {
		const config = ConfigSchema.parse({
			bucketeerHost: process.env.BUCKETEER_HOST,
			bucketeerApiKey: process.env.BUCKETEER_API_KEY,
			bucketeerEnvironmentId: process.env.BUCKETEER_ENVIRONMENT_ID,
			logLevel: process.env.LOG_LEVEL || "info",
		});
		return config;
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error("Configuration validation error:");
			error.errors.forEach((err) => {
				console.error(`  - ${err.path.join(".")}: ${err.message}`);
			});
			console.error("\nPlease check your environment variables or .env file.");
			process.exit(1);
		}
		throw error;
	}
}

// Export singleton config instance
export const config = loadConfig();

// Helper to get environment ID with fallback
export function getEnvironmentId(providedId?: string): string {
	const environmentId = providedId || config.bucketeerEnvironmentId;
	if (!environmentId) {
		throw new Error(
			"environmentId must be provided or set in BUCKETEER_ENVIRONMENT_ID",
		);
	}
	return environmentId;
}
