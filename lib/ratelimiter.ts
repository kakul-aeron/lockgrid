import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedisClient(): Redis | null {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    if (!redis) {
        try {
            redis = new Redis({ url, token });
        } catch (err) {
            console.error('Failed to initialize Upstash Redis client:', err);
            redis = null;
        }
    }
    return redis;
}

const MAX_REQUESTS = 5;
const TIME_WINDOW_SECONDS = 60;

// Simple in-memory fallback for local development when Upstash is not available.
const memoryMap = new Map<string, { count: number; firstTs: number }>();

export async function rateLimit(identifier: string): Promise<boolean> {
    const key = `rate-limit:${identifier}`;
    const now = Date.now();

    const client = getRedisClient();
    if (client) {
        try {
            const [requestCount] = await client
                .multi()
                .incr(key)
                .expire(key, TIME_WINDOW_SECONDS)
                .exec();

            const count = Number(requestCount);

            if (count > MAX_REQUESTS) {
                console.warn(`Rate-limited: ${identifier} has made ${count} requests.`);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Redis error (falling back to memory):', error);
            // fall through to memory fallback
        }
    }

    const entry = memoryMap.get(key);
    if (!entry) {
        memoryMap.set(key, { count: 1, firstTs: now });
        return true;
    }

    if (now - entry.firstTs > TIME_WINDOW_SECONDS * 1000) {
        memoryMap.set(key, { count: 1, firstTs: now });
        return true;
    }

    entry.count += 1;
    if (entry.count > MAX_REQUESTS) {
        console.warn(`Rate-limited (memory): ${identifier} has made ${entry.count} requests.`);
        return false;
    }

    // update map
    memoryMap.set(key, entry);
    return true;
}