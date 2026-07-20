const cookieParser = require('cookie-parser');
const express = require('express');
const connectDB = require('./DB/dbConnection');
const dotenv = require('dotenv').config({
    path: './.env'
})
const cors = require("cors")
const app = express();
const userRouter = require("./routes/userRoutes")
const projectRouter = require("./routes/projectRoutes")
const teamRouter = require("./routes/teamRoutes");
const rateLimiter = require('./middleware/rateLimiterRedis');
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
const SERVER_PORT_NUMBER = 8080;

connectDB()
app.use(rateLimiter({
    bucketSize: 2,
    refillRate: 0.5,
}));
app.use("/api/v1/user", userRouter)
app.use("/api/v1/project", projectRouter)
app.use("/api/v1/team", teamRouter)

app.listen(SERVER_PORT_NUMBER, function (err) {
    if (err) console.log("app error", err);
    console.log("Server listening on PORT", SERVER_PORT_NUMBER);
});