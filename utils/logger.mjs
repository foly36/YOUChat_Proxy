export class Logger {
    static LEVELS = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3,
        TRACE: 4
    };

    constructor(options = {}) {
        this.level = options.level || (process.env.LOG_LEVEL ?
            parseInt(process.env.LOG_LEVEL, 10) :
            Logger.LEVELS.INFO);
        this.instanceId = options.instanceId || null;
        this.prefix = options.prefix || '';
    }

    withPrefix(prefix) {
        return new Logger({
            level: this.level,
            instanceId: this.instanceId,
            prefix: prefix
        });
    }

    withInstance(instanceId) {
        return new Logger({
            level: this.level,
            instanceId: instanceId,
            prefix: this.prefix
        });
    }

    formatMessage(message) {
        let formatted = '';

        if (this.prefix) {
            formatted += `[${this.prefix}] `;
        }

        if (this.instanceId) {
            formatted += `[${this.instanceId}] `;
        }

        return formatted + message;
    }

    error(message, ...args) {
        if (this.level >= Logger.LEVELS.ERROR) {
            console.error(this.formatMessage(message), ...args);
        }
    }

    warn(message, ...args) {
        if (this.level >= Logger.LEVELS.WARN) {
            console.warn(this.formatMessage(message), ...args);
        }
    }

    info(message, ...args) {
        if (this.level >= Logger.LEVELS.INFO) {
            console.log(this.formatMessage(message), ...args);
        }
    }

    debug(message, ...args) {
        if (this.level >= Logger.LEVELS.DEBUG) {
            console.debug(this.formatMessage(message), ...args);
        }
    }

    trace(message, ...args) {
        if (this.level >= Logger.LEVELS.TRACE) {
            console.trace(this.formatMessage(message), ...args);
        }
    }
}

const defaultLogger = new Logger();

export default defaultLogger;