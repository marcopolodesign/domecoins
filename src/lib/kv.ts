import { createClient } from 'redis';

// Initialize Redis client
let redisClient: ReturnType<typeof createClient> | null = null;
let isRedisConfigured = false;

// In-memory fallback for local development
const memoryStore = new Map<string, any>();

// Initialize Redis connection
async function getRedisClient() {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = createClient({ url: process.env.REDIS_URL });
      
      redisClient.on('error', (err) => {
        console.error('[KV] Redis Client Error:', err);
      });

      await redisClient.connect();
      isRedisConfigured = true;
      console.log('[KV] Redis connected successfully');
    } catch (error) {
      console.error('[KV] Failed to connect to Redis:', error);
      redisClient = null;
      isRedisConfigured = false;
    }
  }

  return redisClient;
}

// ==================== INVENTORY ====================

const INVENTORY_KEY_PREFIX = 'inventory:';
const INVENTORY_INDEX_KEY = 'inventory:_index';

/**
 * Get inventory for specific card IDs
 */
export async function getInventory(productIds?: string[]): Promise<Record<string, number>> {
  try {
    const client = await getRedisClient();
    
    if (!client) {
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
      const values = await client.mGet(keys);
      
      const result: Record<string, number> = {};
      productIds.forEach((id, index) => {
        const value = values[index];
        result[id] = value ? parseInt(value as string, 10) : 0;
      });
      
      return result;
    } else {
      // Get all inventory
      const allKeys = await client.sMembers(INVENTORY_INDEX_KEY) || [];
      if (allKeys.length === 0) return {};
      
      const keys = allKeys.map(id => `${INVENTORY_KEY_PREFIX}${id}`);
      const values = await client.mGet(keys);
      
      const result: Record<string, number> = {};
      allKeys.forEach((id, index) => {
        const value = values[index];
        if (value !== null && value !== undefined) {
          result[id] = parseInt(value as string, 10);
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
    const client = await getRedisClient();
    const key = `${INVENTORY_KEY_PREFIX}${productId}`;
    
    if (!client) {
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
      await client.set(key, quantity.toString());
      await client.sAdd(INVENTORY_INDEX_KEY, productId);
    } else {
      await client.del(key);
      await client.sRem(INVENTORY_INDEX_KEY, productId);
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
    const client = await getRedisClient();
    const productIds = Object.keys(items);
    
    if (!client) {
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

    // Use Redis multi/exec for atomic operations
    const multi = client.multi();
    
    // Clear old index
    multi.del(INVENTORY_INDEX_KEY);
    
    // Set all items
    let count = 0;
    productIds.forEach(productId => {
      const quantity = items[productId];
      if (quantity > 0) {
        const key = `${INVENTORY_KEY_PREFIX}${productId}`;
        multi.set(key, quantity.toString());
        multi.sAdd(INVENTORY_INDEX_KEY, productId);
        count++;
      }
    });
    
    await multi.exec();
    
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
    const client = await getRedisClient();
    
    if (!client) {
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

    const allKeys = await client.sMembers(INVENTORY_INDEX_KEY) || [];
    
    if (allKeys.length === 0) return 0;
    
    const multi = client.multi();
    allKeys.forEach(id => {
      multi.del(`${INVENTORY_KEY_PREFIX}${id}`);
    });
    multi.del(INVENTORY_INDEX_KEY);
    
    await multi.exec();
    
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
    const client = await getRedisClient();
    
    if (!client) {
      // Fallback to in-memory
      const index = memoryStore.get(INVENTORY_INDEX_KEY) as string[] || [];
      return index.length;
    }

    const count = await client.sCard(INVENTORY_INDEX_KEY);
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
    const client = await getRedisClient();
    
    if (!client) {
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

    const [priceStr, updatedAt] = await Promise.all([
      client.get(CUSTOM_PRICE_KEY),
      client.get(CUSTOM_PRICE_UPDATED_KEY)
    ]);
    
    const price = priceStr ? parseFloat(priceStr) : null;
    
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
    const client = await getRedisClient();
    const updatedAt = new Date().toISOString();
    
    if (!client) {
      // Fallback to in-memory
      memoryStore.set(CUSTOM_PRICE_KEY, price);
      memoryStore.set(CUSTOM_PRICE_UPDATED_KEY, updatedAt);
      console.log('[KV] Custom price set (in-memory):', price);
      return;
    }

    await Promise.all([
      client.set(CUSTOM_PRICE_KEY, price.toString()),
      client.set(CUSTOM_PRICE_UPDATED_KEY, updatedAt)
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
    const client = await getRedisClient();
    
    if (!client) {
      // Fallback to in-memory
      memoryStore.delete(CUSTOM_PRICE_KEY);
      memoryStore.delete(CUSTOM_PRICE_UPDATED_KEY);
      console.log('[KV] Custom price cleared (in-memory)');
      return;
    }

    await Promise.all([
      client.del(CUSTOM_PRICE_KEY),
      client.del(CUSTOM_PRICE_UPDATED_KEY)
    ]);
    
    console.log('[KV] Custom price cleared');
  } catch (error) {
    console.error('[KV] Error clearing custom price:', error);
    throw error;
  }
}
