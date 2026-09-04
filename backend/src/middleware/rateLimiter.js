const { defaultLimiter } = require("../config/upstash.js");

/**
 * Factory that returns an Express middleware which enforces rate limits per IP using an Upstash Ratelimit instance.
 * Options:
 *  - skipPaths: array of path prefixes to bypass the limiter entirely (e.g. ['/api/analytics', '/socket.io'])
 *  - allowAnalyticsPoll: when true, requests to analytics endpoints with ?poll=1 or header x-analytics-poll will be skipped
 */
function createRateLimiterMiddleware(limiter = defaultLimiter, options = {}) {
    const { skipPaths = [], allowAnalyticsPoll = false } = options;

    return async (req, res, next) => {
        try {
            const path = req.path || req.url || '';

            // Bypass for configured path prefixes (useful to avoid blocking socket.io or whole route groups)
            if (skipPaths.some(prefix => path.startsWith(prefix))) {
                return next();
            }

            // Avoid interfering with WebSocket / Socket.IO handshakes
            const isSocketUpgrade = req.headers && req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket';
            if (isSocketUpgrade || path.startsWith('/socket.io')) {
                return next();
            }

            // Optionally exclude analytics polling calls (temporary measure)
            if (path.startsWith('/api/analytics')) {
                const pollQuery = req.query && (req.query.poll === 'true' || req.query.poll === '1');
                const pollHeader = req.headers['x-analytics-poll'] === '1' || req.headers['x-analytics-poll'] === 'true';
                if (allowAnalyticsPoll && (pollQuery || pollHeader)) {
                    return next();
                }
            }

            // Determine a stable client identifier (prefer X-Forwarded-For when behind a proxy)
            const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '').split(',')[0].trim();

            // Apply the provided Upstash rate limiter using the IP as the key
            const result = await limiter.limit(ip);

            // Set informative headers for clients
            if (result && typeof result.limit !== 'undefined') res.setHeader('X-RateLimit-Limit', result.limit);
            if (result && typeof result.remaining !== 'undefined') res.setHeader('X-RateLimit-Remaining', result.remaining);
            if (result && typeof result.reset !== 'undefined') res.setHeader('X-RateLimit-Reset', result.reset);

            if (!result || result.success === false) {
                return res.status(429).json({ error: 'Rate limit exceeded' });
            }

            next();
        } catch (error) {
            // Don't block traffic if the rate limiter itself fails — log and continue
            console.error('Error in rate limiter middleware:', error);
            next();
        }
    };
}

module.exports = createRateLimiterMiddleware;
module.exports.withLimiter = (limiter, options) => createRateLimiterMiddleware(limiter, options);
module.exports.default = createRateLimiterMiddleware();