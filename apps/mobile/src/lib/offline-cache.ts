import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "@logistikapp/cache_";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export async function cacheSet<T>(
  key: string,
  data: T,
  ttlMs: number
): Promise<void> {
  const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {}
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number
): Promise<T> {
  try {
    const data = await fetcher();
    await cacheSet(key, data, ttlMs);
    return data;
  } catch (err) {
    const cached = await cacheGet<T>(key);
    if (cached !== null) return cached;
    throw err;
  }
}
