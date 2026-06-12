import { createClient } from 'redis';

/**
 * RedisService provides a wrapper for caching, session management, and rate limiting.
 */
export class RedisService {
  private static client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  private static connected = false;

  static async init() {
    if (this.connected) return;
    try {
      await this.client.connect();
      this.connected = true;
      console.log('[Redis] Service Connected');
    } catch (err) {
      console.error('[Redis] Connection Failed - Falling back to Mock', err);
    }
  }

  static async set(key: string, value: any, ttlSeconds: number = 120) {
    if (!this.connected) return;
    await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  }

  static async get(key: string): Promise<any | null> {
    if (!this.connected) return null;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Simple increment for rate limiting (sliding window/fixed window)
   */
  static async increment(key: string, ttlSeconds: number = 60): Promise<number> {
    if (!this.connected) return 1;
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }

  static async del(key: string) {
    if (!this.connected) return;
    await this.client.del(key);
  }

  static isConnected(): boolean {
    return this.connected;
  }
}
