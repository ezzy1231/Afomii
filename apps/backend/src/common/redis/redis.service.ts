import { Injectable } from "@nestjs/common";

type StoredValue = {
  value: string;
  expiresAt?: number;
};

type LockValue = {
  token: string;
  expiresAt: number;
};

@Injectable()
export class RedisService {
  private readonly values = new Map<string, StoredValue>();
  private readonly locks = new Map<string, LockValue>();

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.values.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async get(key: string): Promise<string | null> {
    const entry = this.values.get(key);
    if (!entry) return null;

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.values.delete(key);
      return null;
    }

    return entry.value;
  }

  async peek(key: string): Promise<string | null> {
    const entry = this.values.get(key);
    return entry ? entry.value : null;
  }

  async del(key: string): Promise<void> {
    this.values.delete(key);
    this.locks.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  async acquireLock(lockKey: string, ttlMs: number): Promise<string | null> {
    const existing = this.locks.get(lockKey);
    if (existing && existing.expiresAt > Date.now()) {
      return null;
    }

    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.locks.set(lockKey, {
      token,
      expiresAt: Date.now() + ttlMs,
    });
    return token;
  }

  async releaseLock(lockKey: string, token: string): Promise<void> {
    const existing = this.locks.get(lockKey);
    if (existing && existing.token === token) {
      this.locks.delete(lockKey);
    }
  }

  async ttl(key: string): Promise<number> {
    const entry = this.values.get(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;

    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining <= 0 ? 0 : remaining;
  }

  async listKeys(pattern: string): Promise<string[]> {
    const prefix = pattern.endsWith("*") ? pattern.slice(0, -1) : pattern;
    const keys = [...this.values.keys(), ...this.locks.keys()];
    return [...new Set(keys)].filter((key) => key.startsWith(prefix));
  }

  cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.values.entries()) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        this.values.delete(key);
      }
    }

    for (const [key, entry] of this.locks.entries()) {
      if (entry.expiresAt <= now) {
        this.locks.delete(key);
      }
    }
  }
}
