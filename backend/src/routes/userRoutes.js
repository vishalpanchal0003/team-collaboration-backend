const Router = require("express")
const jwtVerify = require('../middleware/jwtVarify.js')
const {
    userRegistration,
    userLogin,
    changeUserPassword,
    userLogout,
    sendOtp,
    resetPassword,
    getAllUser,
    // practicePaginationWithDummyData,
    practicePaginationWithDB,
    aggregatePractice
} = require('../controllers/UserController.js');
// const limitRateOfReqest = require("../utils/RateLimiter.js");
const rateLimiter = require("../middleware/rateLimiterRedis.js");



const router = Router();


router.route('/register').post(userRegistration)
router.route("/alluser").get(getAllUser)
router.route('/login').post(userLogin)
router.route('/logout').get(jwtVerify, userLogout)
router.route('/changepassword').post(jwtVerify, changeUserPassword)
router.route('/otpsend').post(sendOtp)
router.route('/resetpassword').post(resetPassword)
router.route('/practice').get(practicePaginationWithDB)
router.route('/aggregatepractice').get(aggregatePractice)


module.exports = router