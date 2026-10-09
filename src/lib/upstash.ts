import { Redis } from '@upstash/redis';

/**
 * Kiểm tra xem môi trường đã có biến kết nối Upstash Redis / Vercel KV chưa
 */
export function isUpstashConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return Boolean(url && token);
}

let redisInstance: Redis | null = null;

/**
 * Khởi tạo client kết nối Upstash REST Redis
 */
export function getRedisClient(): Redis | null {
  if (!isUpstashConfigured()) return null;
  if (!redisInstance) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (url && token) {
      redisInstance = new Redis({
        url,
        token,
      });
    }
  }
  return redisInstance;
}
