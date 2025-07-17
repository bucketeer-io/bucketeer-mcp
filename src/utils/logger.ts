import { config } from "../config.js";

export type LogLevel = "error" | "warn" | "info" | "debug";

const LOG_LEVELS: Record<LogLevel, number> = {
	error: 0,
	warn: 1,
	info: 2,
	debug: 3,
};

class Logger {
	private level: number;

	constructor(level: LogLevel) {
		this.level = LOG_LEVELS[level];
	}

	private log(level: LogLevel, message: string, data?: any) {
		if (LOG_LEVELS[level] <= this.level) {
			const timestamp = new Date().toISOString();
			const logEntry = {
				timestamp,
				level,
				message,
				...(data && { data }),
			};

			// Use console.error for all logs in MCP server to avoid stdout conflicts
			console.error(JSON.stringify(logEntry));
		}
	}

	error(message: string, error?: Error | any) {
		this.log("error", message, {
			error:
				error instanceof Error
					? {
							name: error.name,
							message: error.message,
							stack: error.stack,
						}
					: error,
		});
	}

	warn(message: string, data?: any) {
		this.log("warn", message, data);
	}

	info(message: string, data?: any) {
		this.log("info", message, data);
	}

	debug(message: string, data?: any) {
		this.log("debug", message, data);
	}
}

export const logger = new Logger(config.logLevel as LogLevel);
