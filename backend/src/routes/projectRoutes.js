
const Router= require("express");
const { createProject } = require("../controllers/ProjectController");
const jwtVerify = require("../middleware/jwtVarify");

const router = Router();



router.route("/createproject").post(jwtVerify,createProject)

module.exports= router;