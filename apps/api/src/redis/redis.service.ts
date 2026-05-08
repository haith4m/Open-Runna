import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';

@Injectable()
export class RedisService {
  private redis: Redis.Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, exSeconds?: number): Promise<void> {
    if (exSeconds) {
      await this.redis.setex(key, exSeconds, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  async getClient(): Promise<Redis.Redis> {
    return this.redis;
  }
}
