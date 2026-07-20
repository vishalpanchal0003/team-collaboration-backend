const { now } = require('mongoose');
const client = require('../utils/redisClient');

const rateLimiter = (option) => {
    const config = {
        bucketSize= 10,
        refillToken= 2,
        interval= 1000,
    } = option;

    return async (req, res, next) => {
        let ip = req.ip;
        let key = `limit key ${ip}`;
        let now = Date.now()
        const data = await client.hGetAll(key);

        let token = bucketSize;
        let lastRefill = now;

        if (data.token && data.lastRefill) {
            token = parseFloat(data.token);
            lastRefill = parseInt(data.lastRefill, 10);

            const elapsed = (now - lastRefill) / 1000;
            token = Math.min(bucketSize, token + elapsed * refillToken)
        }
        if (token < 1) {
            return res.status(429).json({ message: "to many request try again later" })
        }
        token -= 1
        await client.hSet(key, {
            token: token.toString(),
            lastRefill: lastRefill.toString()
        })
        next()

    }
}

module.exports = rateLimiter