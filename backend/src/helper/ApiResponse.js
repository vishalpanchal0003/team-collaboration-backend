
class ApiResponse {
    constructor(message = "success", data, statusCode,) {
        this.message = message;
        this.data = data
        this.statusCode = statusCode
        this.success = statusCode < 400
    }
}
module.exports = ApiResponse