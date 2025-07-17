#!/usr/bin/env node

import { BucketeerMCPServer } from "./server.js";
import { logger } from "./utils/logger.js";

async function main() {
	try {
		const server = new BucketeerMCPServer();
		await server.start();
	} catch (error) {
		logger.error("Failed to start server", error);
		process.exit(1);
	}
}

// Run the server
main();
