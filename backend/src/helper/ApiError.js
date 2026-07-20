class ApiError extends Error {
    constructor(statusCode, message = "something went wrong", error = [], stack) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.error = error;
        this.success = false;
        this.stack = stack || this.stack;
        if (!stack) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    toJSON() {
        return {
            statusCode: this.statusCode,
            message: this.message,
            error: this.error,
            success: this.success,
            stack: this.stack
        };
    }
}

module.exports = ApiError;