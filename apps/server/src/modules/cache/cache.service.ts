import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface MemEntry {
  value: string;
  expireAt: number;
}

/** 缓存服务：优先 Redis，不可用时降级内存（阶段 C3） */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly memory = new Map<string, MemEntry>();
  private redis: Redis | null = null;

  constructor(private config: ConfigService) {
    this.initRedis();
  }

  private initRedis() {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) return;

    try {
      this.redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
      this.redis.connect().then(() => {
        this.logger.log('Redis 缓存已连接');
      }).catch((err) => {
        this.logger.warn('Redis 不可用，使用内存缓存', err);
        this.redis = null;
      });
    } catch (err) {
      this.logger.warn('Redis 初始化失败，使用内存缓存', err);
      this.redis = null;
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.redis) {
      try {
        return await this.redis.get(key);
      } catch {
        /* fallback */
      }
    }

    const entry = this.memory.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expireAt) {
      this.memory.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds = 300): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.set(key, value, 'EX', ttlSeconds);
        return;
      } catch {
        /* fallback */
      }
    }

    this.memory.set(key, { value, expireAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch {
        /* ignore */
      }
    }
    this.memory.delete(key);
  }

  async onModuleDestroy() {
    if (this.redis) await this.redis.quit();
  }
}
