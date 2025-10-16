import { kv } from '@vercel/kv';

// Vercel KV helper functions for inventory and custom price

// ==================== INVENTORY ====================

const INVENTORY_KEY_PREFIX = 'inventory:';
const INVENTORY_INDEX_KEY = 'inventory:_index';

/**
 * Get inventory for specific card IDs
 */
export async function getInventory(productIds?: string[]): Promise<Record<string, number>> {
  try {
    if (productIds && productIds.length > 0) {
      // Get specific cards
      const keys = productIds.map(id => `${INVENTORY_KEY_PREFIX}${id}`);
      const values = await kv.mget<number[]>(...keys);
      
      const result: Record<string, number> = {};
      productIds.forEach((id, index) => {
        result[id] = values[index] || 0;
      });
      
      return result;
    } else {
      // Get all inventory
      const allKeys = await kv.smembers<string[]>(INVENTORY_INDEX_KEY) || [];
      if (allKeys.length === 0) return {};
      
      const keys = allKeys.map(id => `${INVENTORY_KEY_PREFIX}${id}`);
      const values = await kv.mget<number[]>(...keys);
      
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
    
    if (quantity > 0) {
      await kv.set(key, quantity);
      await kv.sadd(INVENTORY_INDEX_KEY, productId);
    } else {
      await kv.del(key);
      await kv.srem(INVENTORY_INDEX_KEY, productId);
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
    const pipeline = kv.pipeline();
    const productIds = Object.keys(items);
    
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
    const allKeys = await kv.smembers<string[]>(INVENTORY_INDEX_KEY) || [];
    
    if (allKeys.length === 0) return 0;
    
    const pipeline = kv.pipeline();
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
    const count = await kv.scard(INVENTORY_INDEX_KEY);
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
    const [price, updatedAt] = await Promise.all([
      kv.get<number>(CUSTOM_PRICE_KEY),
      kv.get<string>(CUSTOM_PRICE_UPDATED_KEY)
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
    
    await Promise.all([
      kv.set(CUSTOM_PRICE_KEY, price),
      kv.set(CUSTOM_PRICE_UPDATED_KEY, updatedAt)
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
    await Promise.all([
      kv.del(CUSTOM_PRICE_KEY),
      kv.del(CUSTOM_PRICE_UPDATED_KEY)
    ]);
    
    console.log('[KV] Custom price cleared');
  } catch (error) {
    console.error('[KV] Error clearing custom price:', error);
    throw error;
  }
}

