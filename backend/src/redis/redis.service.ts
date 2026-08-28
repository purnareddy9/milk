import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly memoryCache = new Map<string, { value: string; expiresAt: number }>();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    try {
      this.client = new Redis({
        host,
        port,
        retryStrategy: (times) => {
          if (times > 2) {
            return null; // Stop retrying
          }
          return 500;
        },
        lazyConnect: true,
        connectTimeout: 1000,
        enableOfflineQueue: false,
      });

      this.client.on('error', (err) => {
        // Gracefully handle connection refusals without bubbling unhandled events
      });

      await this.client.connect().catch((err) => {
        this.logger.warn(`Redis connection failed (${err.message}). Using in-memory fallback.`);
        this.client = null;
      });

      if (this.client) {
        this.logger.log(`Redis connected on ${host}:${port}`);
      }
    } catch (err) {
      this.logger.warn('Redis initialization failed. Using in-memory fallback.');
      this.client = null;
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch {
        // Fallback to memory
      }
    }

    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds: number = 300): Promise<void> {
    if (this.client) {
      try {
        await this.client.set(key, value, 'EX', ttlSeconds);
        return;
      } catch {
        // Fallback to memory
      }
    }

    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
      } catch {}
    }
    this.memoryCache.delete(key);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
