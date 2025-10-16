import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
// Environment variables are automatically set when you connect Upstash via Vercel Marketplace
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Check if Redis is configured
const isRedisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN
);

if (!isRedisConfigured) {
  console.warn('[KV] Upstash Redis not configured. Using in-memory fallback for local development.');
}

// In-memory fallback for local development
const memoryStore = new Map<string, any>();

// ==================== INVENTORY ====================

const INVENTORY_KEY_PREFIX = 'inventory:';
const INVENTORY_INDEX_KEY = 'inventory:_index';

/**
 * Get inventory for specific card IDs
 */
export async function getInventory(productIds?: string[]): Promise<Record<string, number>> {
  try {
    if (!isRedisConfigured) {
      // Fallback to in-memory
      const result: Record<string, number> = {};
      if (productIds && productIds.length > 0) {
        productIds.forEach(id => {
          result[id] = (memoryStore.get(`${INVENTORY_KEY_PREFIX}${id}`) as number) || 0;
        });
      } else {
        const allIds = memoryStore.get(INVENTORY_INDEX_KEY) as string[] || [];
        allIds.forEach(id => {
          result[id] = (memoryStore.get(`${INVENTORY_KEY_PREFIX}${id}`) as number) || 0;
        });
      }
      return result;
    }

    if (productIds && productIds.length > 0) {
      // Get specific cards
      const keys = productIds.map(id => `${INVENTORY_KEY_PREFIX}${id}`);
      const values = await redis.mget<number[]>(...keys);
      
      const result: Record<string, number> = {};
      productIds.forEach((id, index) => {
        result[id] = values[index] || 0;
      });
      
      return result;
    } else {
      // Get all inventory
      const allKeys = await redis.smembers<string[]>(INVENTORY_INDEX_KEY) || [];
      if (allKeys.length === 0) return {};
      
      const keys = allKeys.map(id => `${INVENTORY_KEY_PREFIX}${id}`);
      const values = await redis.mget<number[]>(...keys);
      
      const result: Record<string, number> = {};
      allKeys.forEach((id, index) => {
        if (values[index] !== null && values[index] !== undefined) {
          result[id] = values[index];
        }
      });
      
      return result;
    }
  } catch (error) {
    console.error('[KV] Error getting inventory:', error);
    return {};
  }
}

/**
 * Set inventory for a single card
 */
export async function setInventoryItem(productId: string, quantity: number): Promise<void> {
  try {
    const key = `${INVENTORY_KEY_PREFIX}${productId}`;
    
    if (!isRedisConfigured) {
      // Fallback to in-memory
      if (quantity > 0) {
        memoryStore.set(key, quantity);
        const index = memoryStore.get(INVENTORY_INDEX_KEY) as string[] || [];
        if (!index.includes(productId)) {
          index.push(productId);
          memoryStore.set(INVENTORY_INDEX_KEY, index);
        }
      } else {
        memoryStore.delete(key);
        const index = memoryStore.get(INVENTORY_INDEX_KEY) as string[] || [];
        memoryStore.set(INVENTORY_INDEX_KEY, index.filter(id => id !== productId));
      }
      return;
    }

    if (quantity > 0) {
      await redis.set(key, quantity);
      await redis.sadd(INVENTORY_INDEX_KEY, productId);
    } else {
      await redis.del(key);
      await redis.srem(INVENTORY_INDEX_KEY, productId);
    }
  } catch (error) {
    console.error(`[KV] Error setting inventory for ${productId}:`, error);
    throw error;
  }
}

/**
 * Bulk set inventory items
 */
export async function setInventoryBulk(items: Record<string, number>): Promise<number> {
  try {
    const productIds = Object.keys(items);
    
    if (!isRedisConfigured) {
      // Fallback to in-memory
      memoryStore.delete(INVENTORY_INDEX_KEY);
      const newIndex: string[] = [];
      let count = 0;
      
      productIds.forEach(productId => {
        const quantity = items[productId];
        if (quantity > 0) {
          memoryStore.set(`${INVENTORY_KEY_PREFIX}${productId}`, quantity);
          newIndex.push(productId);
          count++;
        }
      });
      
      memoryStore.set(INVENTORY_INDEX_KEY, newIndex);
      console.log(`[KV] Bulk set ${count} inventory items (in-memory)`);
      return count;
    }

    const pipeline = redis.pipeline();
    
    // Clear old index
    pipeline.del(INVENTORY_INDEX_KEY);
    
    // Set all items
    let count = 0;
    productIds.forEach(productId => {
      const quantity = items[productId];
      if (quantity > 0) {
        const key = `${INVENTORY_KEY_PREFIX}${productId}`;
        pipeline.set(key, quantity);
        pipeline.sadd(INVENTORY_INDEX_KEY, productId);
        count++;
      }
    });
    
    await pipeline.exec();
    
    console.log(`[KV] Bulk set ${count} inventory items`);
    return count;
  } catch (error) {
    console.error('[KV] Error bulk setting inventory:', error);
    throw error;
  }
}

/**
 * Clear all inventory
 */
export async function clearInventory(): Promise<number> {
  try {
    if (!isRedisConfigured) {
      // Fallback to in-memory
      const index = memoryStore.get(INVENTORY_INDEX_KEY) as string[] || [];
      const count = index.length;
      
      index.forEach(id => {
        memoryStore.delete(`${INVENTORY_KEY_PREFIX}${id}`);
      });
      memoryStore.delete(INVENTORY_INDEX_KEY);
      
      console.log(`[KV] Cleared ${count} inventory items (in-memory)`);
      return count;
    }

    const allKeys = await redis.smembers<string[]>(INVENTORY_INDEX_KEY) || [];
    
    if (allKeys.length === 0) return 0;
    
    const pipeline = redis.pipeline();
    allKeys.forEach(id => {
      pipeline.del(`${INVENTORY_KEY_PREFIX}${id}`);
    });
    pipeline.del(INVENTORY_INDEX_KEY);
    
    await pipeline.exec();
    
    console.log(`[KV] Cleared ${allKeys.length} inventory items`);
    return allKeys.length;
  } catch (error) {
    console.error('[KV] Error clearing inventory:', error);
    throw error;
  }
}

/**
 * Get total inventory count
 */
export async function getInventoryCount(): Promise<number> {
  try {
    if (!isRedisConfigured) {
      // Fallback to in-memory
      const index = memoryStore.get(INVENTORY_INDEX_KEY) as string[] || [];
      return index.length;
    }

    const count = await redis.scard(INVENTORY_INDEX_KEY);
    return count || 0;
  } catch (error) {
    console.error('[KV] Error getting inventory count:', error);
    return 0;
  }
}

// ==================== CUSTOM PRICE ====================

const CUSTOM_PRICE_KEY = 'custom_dollar_price';
const CUSTOM_PRICE_UPDATED_KEY = 'custom_dollar_price:updated';

/**
 * Get custom dollar price
 */
export async function getCustomPrice(): Promise<{ price: number | null; updatedAt: string | null }> {
  try {
    if (!isRedisConfigured) {
      // Fallback to in-memory
      const price = memoryStore.get(CUSTOM_PRICE_KEY) as number | null;
      const updatedAt = memoryStore.get(CUSTOM_PRICE_UPDATED_KEY) as string | null;
      
      if (price && updatedAt) {
        const daysSinceUpdate = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 7) {
          console.log('[KV] Found custom price (in-memory):', price);
          return { price, updatedAt };
        }
      }
      
      return { price: null, updatedAt: null };
    }

    const [price, updatedAt] = await Promise.all([
      redis.get<number>(CUSTOM_PRICE_KEY),
      redis.get<string>(CUSTOM_PRICE_UPDATED_KEY)
    ]);
    
    if (price && updatedAt) {
      // Check if still valid (within 7 days)
      const daysSinceUpdate = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) {
        console.log('[KV] Found custom price:', price);
        return { price, updatedAt };
      } else {
        console.log('[KV] Custom price expired after', daysSinceUpdate, 'days');
        // Expired, clear it
        await clearCustomPrice();
      }
    }
    
    return { price: null, updatedAt: null };
  } catch (error) {
    console.error('[KV] Error getting custom price:', error);
    return { price: null, updatedAt: null };
  }
}

/**
 * Set custom dollar price
 */
export async function setCustomPrice(price: number): Promise<void> {
  try {
    const updatedAt = new Date().toISOString();
    
    if (!isRedisConfigured) {
      // Fallback to in-memory
      memoryStore.set(CUSTOM_PRICE_KEY, price);
      memoryStore.set(CUSTOM_PRICE_UPDATED_KEY, updatedAt);
      console.log('[KV] Custom price set (in-memory):', price);
      return;
    }

    await Promise.all([
      redis.set(CUSTOM_PRICE_KEY, price),
      redis.set(CUSTOM_PRICE_UPDATED_KEY, updatedAt)
    ]);
    
    console.log('[KV] Custom price set:', price);
  } catch (error) {
    console.error('[KV] Error setting custom price:', error);
    throw error;
  }
}

/**
 * Clear custom dollar price
 */
export async function clearCustomPrice(): Promise<void> {
  try {
    if (!isRedisConfigured) {
      // Fallback to in-memory
      memoryStore.delete(CUSTOM_PRICE_KEY);
      memoryStore.delete(CUSTOM_PRICE_UPDATED_KEY);
      console.log('[KV] Custom price cleared (in-memory)');
      return;
    }

    await Promise.all([
      redis.del(CUSTOM_PRICE_KEY),
      redis.del(CUSTOM_PRICE_UPDATED_KEY)
    ]);
    
    console.log('[KV] Custom price cleared');
  } catch (error) {
    console.error('[KV] Error clearing custom price:', error);
    throw error;
  }
}
