const redis = require('./redis_client');
/* eslint-disable no-unused-vars */
const keyGenerator = require('./redis_key_generator');
const timeUtils = require('../../../utils/time_utils');
/* eslint-enable */

/* eslint-disable no-unused-vars */

// Challenge 7
const hitSlidingWindow = async (name, opts) => {
	const client = redis.getClient();

	const currentTimestamp = timeUtils.getCurrentTimestampMillis();
  const windowSize = opts.interval;
	const limiterKey = keyGenerator.getKey(
		`limiter:${windowSize}:${name}:${opts.maxHits}`
	);

	const transaction = client.multi();

	transaction.zadd(limiterKey, currentTimestamp, `${currentTimestamp}-${Math.random()}`);
	transaction.zremrangebyscore(limiterKey, '-inf', currentTimestamp - windowSize);
	transaction.zcard(limiterKey);

	const response = await transaction.execAsync();
	const hits = parseInt(response[2], 10);

	let hitsRemaining;

	if (hits > opts.maxHits) {
		// Too many hits.
		hitsRemaining = -1;
	} else {
		// Return number of hits remaining.
		hitsRemaining = opts.maxHits - hits;
	}

	return hitsRemaining;
};

/* eslint-enable */

module.exports = {
	/**
	 * Record a hit against a unique resource that is being
	 * rate limited.  Will return 0 when the resource has hit
	 * the rate limit.
	 * @param {string} name - the unique name of the resource.
	 * @param {Object} opts - object containing interval and maxHits details:
	 *   {
	 *     interval: 1,
	 *     maxHits: 5
	 *   }
	 * @returns {Promise} - Promise that resolves to number of hits remaining,
	 *   or 0 if the rate limit has been exceeded..
	 */
	hit: hitSlidingWindow,
};
