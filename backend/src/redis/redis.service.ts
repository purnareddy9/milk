import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isProduction = false;
  private readonly memoryCache = new Map<string, { value: string; expiresAt: number }>();
  private readonly MAX_LOCAL_CACHE_SIZE = 1000;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
  }

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');

    try {
      if (redisUrl) {
        this.client = new Redis(redisUrl, {
          retryStrategy: (times) => (times > 3 ? null : 1000),
          lazyConnect: true,
          connectTimeout: 3000,
          enableOfflineQueue: false,
        });
      } else {
        this.client = new Redis({
          host,
          port,
          password: password || undefined,
          retryStrategy: (times) => (times > 3 ? null : 1000),
          lazyConnect: true,
          connectTimeout: 3000,
          enableOfflineQueue: false,
        });
      }

      this.client.on('error', (err) => {
        if (this.isProduction) {
          this.logger.error(`🚨 [Production Redis Alert] Connection error: ${err.message}`, err.stack);
        }
      });

      await this.client.connect().catch((err) => {
        if (this.isProduction) {
          this.logger.error(
            `🚨 [Production Redis Alert] Failed to connect to Redis at ${host}:${port}: ${err.message}. Running degraded cache.`,
            err.stack,
          );
        } else {
          this.logger.log(`ℹ️ Redis not running locally at ${host}:${port}. Using local in-memory store for development.`);
        }
        this.client = null;
      });

      if (this.client) {
        this.logger.log(`✅ Redis connected successfully (${host}:${port})`);
      }
    } catch (err: any) {
      if (this.isProduction) {
        this.logger.error(`🚨 [Production Redis Alert] Initialization error: ${err.message}`, err.stack);
      }
      this.client = null;
    }
  }

  public get isConnected(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch (err: any) {
        if (this.isProduction) {
          this.logger.warn(`Redis GET failed for key "${key}": ${err.message}`);
        }
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
      } catch (err: any) {
        if (this.isProduction) {
          this.logger.warn(`Redis SET failed for key "${key}": ${err.message}`);
        }
      }
    }

    // Bounded local cache pruning to avoid memory leaks
    if (this.memoryCache.size >= this.MAX_LOCAL_CACHE_SIZE) {
      this.pruneExpiredLocalCache();
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
      } catch (err: any) {
        if (this.isProduction) {
          this.logger.warn(`Redis DEL failed for key "${key}": ${err.message}`);
        }
      }
    }
    this.memoryCache.delete(key);
  }

  private pruneExpiredLocalCache() {
    const now = Date.now();
    for (const [k, v] of this.memoryCache.entries()) {
      if (now > v.expiresAt) {
        this.memoryCache.delete(k);
      }
    }
    // If still oversized after pruning expired, remove oldest entries
    if (this.memoryCache.size >= this.MAX_LOCAL_CACHE_SIZE) {
      const keys = Array.from(this.memoryCache.keys()).slice(0, 200);
      for (const k of keys) {
        this.memoryCache.delete(k);
      }
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
