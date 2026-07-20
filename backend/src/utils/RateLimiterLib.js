const rateLimiter = require("express-rate-limit");

const limitRateOfReqest = rateLimiter({
    window: 2 * 60 * 1000,
    limit: 2,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
})
module.exports = limitRateOfReqest