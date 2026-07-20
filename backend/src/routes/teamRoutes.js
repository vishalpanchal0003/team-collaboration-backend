
const Router = require("express");
const {  updateTeamInfo, deleteTeam, getAllTeams, createTeam } = require("../controllers/TeamController");
const jwtVerify = require("../middleware/jwtVarify");

const router = Router();

router.route('/create-team').post(jwtVerify, createTeam)
router.route('/update-team/:id').patch(jwtVerify, updateTeamInfo)
router.route('/delete-team/:id').delete(jwtVerify, deleteTeam)
router.route('/get-all-team').get(jwtVerify, getAllTeams)

module.exports = router;