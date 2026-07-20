const mongoose = require("mongoose")
const ApiError = require("../helper/ApiError")


const connectDB = async () => {
    try {
        let connection = await mongoose.connect(`${process.env.DB_URL}/${process.env.DB_NAME}`)
        console.log("DB IS CONNECTED NOW AND RUNNNING ON HOST ULR", connection.connection.host)
    } catch (error) {
        console.log("databaseError", error)
        throw new ApiError(500,"somthing happend while connect database to the app")
    }
}
module.exports = connectDB