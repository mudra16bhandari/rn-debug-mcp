export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

class Logger {
    private level: LogLevel = LogLevel.INFO;

    setLevel(level: LogLevel) {
        this.level = level;
    }

    debug(message: string, ...args: any[]) {
        if (this.level <= LogLevel.DEBUG) {
            console.error(`[DEBUG] ${message}`, ...args);
        }
    }

    info(message: string, ...args: any[]) {
        if (this.level <= LogLevel.INFO) {
            console.error(`[INFO] ${message}`, ...args);
        }
    }

    warn(message: string, ...args: any[]) {
        if (this.level <= LogLevel.WARN) {
            console.error(`[WARN] ${message}`, ...args);
        }
    }

    error(message: string, ...args: any[]) {
        if (this.level <= LogLevel.ERROR) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    }
}

// Export singleton
// Note: We use console.error because MCP server communicates over stdout
export const logger = new Logger();
