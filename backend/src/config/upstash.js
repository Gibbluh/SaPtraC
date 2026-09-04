const { Ratelimit } = require('@upstash/ratelimit');
const { Redis } = require('@upstash/redis');
const dotenv = require("dotenv");   
dotenv.config();    

const redis = Redis.fromEnv();

// Factory to create per-route / per-purpose rate limiters sharing the same Redis instance.
function createRatelimit(points = 100, window = '1 m', analytics = false) {
    return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(points, window),
        analytics,
    });
}

// Default global limiter (per-IP)
const defaultLimiter = createRatelimit(100, '1 m', true);

module.exports = { redis, createRatelimit, defaultLimiter };