import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { logger } from "./utils/logger.js";
import { tools } from "./tools/index.js";

export class BucketeerMCPServer {
	private server: Server;

	constructor() {
		this.server = new Server(
			{
				name: "bucketeer-mcp-server",
				version: "1.0.0",
			},
			{
				capabilities: {
					tools: {},
				},
			},
		);

		this.setupHandlers();
		this.setupErrorHandling();
	}

	private setupHandlers() {
		// Handle list tools request
		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			logger.debug("Listing available tools");

			return {
				tools: tools.map((tool) => ({
					name: tool.name,
					description: tool.description,
					inputSchema: tool.inputSchema,
				})),
			};
		});

		// Handle tool calls
		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const { name, arguments: args } = request.params;

			logger.info(`Tool called: ${name}`, { arguments: args });

			const tool = tools.find((t) => t.name === name);

			if (!tool) {
				logger.error(`Tool not found: ${name}`);
				throw new Error(`Tool not found: ${name}`);
			}

			try {
				const result = await tool.handler(args);
				logger.info(`Tool ${name} executed successfully`);
				return result;
			} catch (error) {
				logger.error(`Tool ${name} execution failed`, error);
				throw error;
			}
		});
	}

	private setupErrorHandling() {
		this.server.onerror = (error) => {
			logger.error("MCP server error", error);
		};

		process.on("SIGINT", async () => {
			logger.info("Shutting down MCP server...");
			await this.stop();
			process.exit(0);
		});

		process.on("SIGTERM", async () => {
			logger.info("Shutting down MCP server...");
			await this.stop();
			process.exit(0);
		});
	}

	async start() {
		logger.info("Starting Bucketeer MCP server...");

		const transport = new StdioServerTransport();
		await this.server.connect(transport);

		logger.info("Bucketeer MCP server started successfully");
	}

	async stop() {
		await this.server.close();
		logger.info("Bucketeer MCP server stopped");
	}
}
