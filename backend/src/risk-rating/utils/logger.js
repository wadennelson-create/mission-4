/**
 * Simple logger utility for risk-rating API
 */

const LOG_LEVELS = {
	INFO: "INFO",
	WARN: "WARN",
	ERROR: "ERROR",
	DEBUG: "DEBUG",
};

const isTestEnvironment =
	process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

function formatLog(level, message, data) {
	const timestamp = new Date().toISOString();
	const dataStr = data ? ` | ${JSON.stringify(data)}` : "";
	return `[${timestamp}] [${level}] ${message}${dataStr}`;
}

export const logger = {
	info: (message, data) => {
		if (!isTestEnvironment) {
			console.log(formatLog(LOG_LEVELS.INFO, message, data));
		}
	},
	warn: (message, data) => {
		if (!isTestEnvironment) {
			console.warn(formatLog(LOG_LEVELS.WARN, message, data));
		}
	},
	error: (message, data) => {
		if (!isTestEnvironment) {
			console.error(formatLog(LOG_LEVELS.ERROR, message, data));
		}
	},
	debug: (message, data) => {
		if (process.env.DEBUG === "true" && !isTestEnvironment) {
			console.log(formatLog(LOG_LEVELS.DEBUG, message, data));
		}
	},
};
