import { createClient } from 'redis';
import fs from 'fs';
import path from 'path';

// Initialize Redis client
let redisClient: ReturnType<typeof createClient> | null = null;
let isRedisConfigured = false;

// In-memory fallback for local development
const memoryStore = new Map<string, any>();

// Local file paths for development
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data', 'local');
const LOCAL_INVENTORY_FILE = path.join(LOCAL_DATA_DIR, 'inventory.json');
const LOCAL_CUSTOM_PRICE_FILE = path.join(LOCAL_DATA_DIR, 'custom-price.json');

// Helper: Read local JSON file
function readLocalJSON(filePath: string): any {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('[KV] Error reading local file:', filePath, error);
  }
  return null;
}

// Helper: Write local JSON file
function writeLocalJSON(filePath: string, data: any): void {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('[KV] Error writing local file:', filePath, error);
  }
}

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
      // LOCAL DEVELOPMENT: Read from JSON file
      console.log('[KV] No Redis connection, reading inventory from local file...');
      const localData = readLocalJSON(LOCAL_INVENTORY_FILE);
      const inventory = localData?.inventory || {};
      
      if (productIds && productIds.length > 0) {
        // Return only requested IDs
        const result: Record<string, number> = {};
        productIds.forEach(id => {
          result[id] = inventory[id] || 0;
        });
        console.log(`[KV] Found ${Object.keys(result).length} requested items (local file)`);
        return result;
      }
      
      // Return all inventory
      console.log(`[KV] Found ${Object.keys(inventory).length} total items (local file)`);
      return inventory;
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
      // LOCAL DEVELOPMENT: Write to JSON file
      const inventory: Record<string, number> = {};
      let count = 0;
      
      productIds.forEach(productId => {
        const quantity = items[productId];
        if (quantity > 0) {
          inventory[productId] = quantity;
          count++;
        }
      });
      
      const localData = {
        comment: "Local inventory for development. Updated from CSV upload.",
        lastUpdated: new Date().toISOString(),
        inventory
      };
      
      writeLocalJSON(LOCAL_INVENTORY_FILE, localData);
      console.log(`[KV] Bulk set ${count} inventory items (local file)`);
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
      // LOCAL DEVELOPMENT: Read from JSON file
      const localData = readLocalJSON(LOCAL_INVENTORY_FILE);
      const inventory = localData?.inventory || {};
      return Object.keys(inventory).length;
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
      // LOCAL DEVELOPMENT: Read from JSON file
      console.log('[KV] No Redis connection, reading custom price from local file...');
      const localData = readLocalJSON(LOCAL_CUSTOM_PRICE_FILE);
      
      if (localData && localData.price) {
        const price = parseFloat(localData.price);
        const updatedAt = localData.updatedAt || new Date().toISOString();
        
        console.log('[KV] Found custom price (local file):', price);
        return { price, updatedAt };
      }
      
      console.log('[KV] No custom price found in local file');
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
      // LOCAL DEVELOPMENT: Write to JSON file
      const localData = {
        price,
        updatedAt,
        source: 'local-development'
      };
      writeLocalJSON(LOCAL_CUSTOM_PRICE_FILE, localData);
      console.log('[KV] Custom price set (local file):', price);
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

// ==================== ORDERS ====================

const ORDER_KEY_PREFIX = 'order:';
const ORDER_INDEX_KEY = 'order:_index';
const ORDER_COUNTER_KEY = 'order:counter';

export interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  customer: {
    firstName: string;
    lastName: string;
    dni: string;
    phone: string;
    email: string;
    address: string;
  };
  items: Array<{
    cardId: string;
    cardName: string;
    imageUrl: string;
    setName: string;
    rarity: string;
    priceUsd: number;
    priceArs: number;
    inStock: boolean;
  }>;
  itemsInStock: number;
  itemsToOrder: number;
  totalArs: number;
  totalUsd: number;
  paymentMethod: 'transfer' | 'mercadopago' | null;
  paymentLink: string | null;
  paymentStatus: 'pending' | 'sent' | 'confirmed' | null;
}

/**
 * Generate order number: ORD-YYYYMMDD-XXX
 */
async function generateOrderNumber(): Promise<string> {
  const client = await getRedisClient();
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  
  let counter: number;
  
  if (!client) {
    // In-memory fallback
    const currentCounter = memoryStore.get(ORDER_COUNTER_KEY) as number || 0;
    counter = currentCounter + 1;
    memoryStore.set(ORDER_COUNTER_KEY, counter);
  } else {
    counter = await client.incr(ORDER_COUNTER_KEY);
  }
  
  const paddedCounter = String(counter).padStart(3, '0');
  return `ORD-${dateStr}-${paddedCounter}`;
}

/**
 * Create a new order
 */
export async function createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<Order> {
  try {
    const client = await getRedisClient();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const orderNumber = await generateOrderNumber();
    const now = new Date().toISOString();
    
    const order: Order = {
      id,
      orderNumber,
      createdAt: now,
      updatedAt: now,
      ...orderData,
    };
    
    const key = `${ORDER_KEY_PREFIX}${id}`;
    
    if (!client) {
      // In-memory fallback
      memoryStore.set(key, order);
      const index = memoryStore.get(ORDER_INDEX_KEY) as string[] || [];
      index.push(id);
      memoryStore.set(ORDER_INDEX_KEY, index);
      console.log('[KV] Order created (in-memory):', orderNumber);
      return order;
    }
    
    await client.set(key, JSON.stringify(order));
    await client.sAdd(ORDER_INDEX_KEY, id);
    
    console.log('[KV] Order created:', orderNumber);
    return order;
  } catch (error) {
    console.error('[KV] Error creating order:', error);
    throw error;
  }
}

/**
 * Get order by ID
 */
export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const client = await getRedisClient();
    const key = `${ORDER_KEY_PREFIX}${orderId}`;
    
    if (!client) {
      // In-memory fallback
      return memoryStore.get(key) as Order || null;
    }
    
    const data = await client.get(key);
    if (!data) return null;
    
    return JSON.parse(data as string) as Order;
  } catch (error) {
    console.error('[KV] Error getting order:', error);
    return null;
  }
}

/**
 * Get all orders
 */
export async function getAllOrders(): Promise<Order[]> {
  try {
    const client = await getRedisClient();
    
    if (!client) {
      // In-memory fallback
      const index = memoryStore.get(ORDER_INDEX_KEY) as string[] || [];
      return index.map(id => memoryStore.get(`${ORDER_KEY_PREFIX}${id}`) as Order).filter(Boolean);
    }
    
    const orderIds = await client.sMembers(ORDER_INDEX_KEY) || [];
    if (orderIds.length === 0) return [];
    
    const keys = orderIds.map(id => `${ORDER_KEY_PREFIX}${id}`);
    const values = await client.mGet(keys);
    
    const orders: Order[] = [];
    values.forEach((value) => {
      if (value) {
        try {
          orders.push(JSON.parse(value as string) as Order);
        } catch (e) {
          console.error('[KV] Error parsing order:', e);
        }
      }
    });
    
    // Sort by createdAt desc
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('[KV] Error getting all orders:', error);
    return [];
  }
}

/**
 * Update order
 */
export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<Order | null> {
  try {
    const client = await getRedisClient();
    const key = `${ORDER_KEY_PREFIX}${orderId}`;
    
    const existingOrder = await getOrder(orderId);
    if (!existingOrder) return null;
    
    const updatedOrder: Order = {
      ...existingOrder,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    if (!client) {
      // In-memory fallback
      memoryStore.set(key, updatedOrder);
      console.log('[KV] Order updated (in-memory):', orderId);
      return updatedOrder;
    }
    
    await client.set(key, JSON.stringify(updatedOrder));
    console.log('[KV] Order updated:', orderId);
    return updatedOrder;
  } catch (error) {
    console.error('[KV] Error updating order:', error);
    throw error;
  }
}

/**
 * Delete order
 */
export async function deleteOrder(orderId: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const key = `${ORDER_KEY_PREFIX}${orderId}`;
    
    if (!client) {
      // In-memory fallback
      memoryStore.delete(key);
      const index = memoryStore.get(ORDER_INDEX_KEY) as string[] || [];
      memoryStore.set(ORDER_INDEX_KEY, index.filter(id => id !== orderId));
      console.log('[KV] Order deleted (in-memory):', orderId);
      return true;
    }
    
    await client.del(key);
    await client.sRem(ORDER_INDEX_KEY, orderId);
    console.log('[KV] Order deleted:', orderId);
    return true;
  } catch (error) {
    console.error('[KV] Error deleting order:', error);
    return false;
  }
}

/**
 * Get order statistics
 */
export async function getOrderStats(): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  paid: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
}> {
  try {
    const orders = await getAllOrders();
    
    const stats = {
      total: orders.length,
      pending: 0,
      confirmed: 0,
      paid: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
    };
    
    orders.forEach(order => {
      stats[order.status]++;
      if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
        stats.totalRevenue += order.totalArs;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('[KV] Error getting order stats:', error);
    return {
      total: 0,
      pending: 0,
      confirmed: 0,
      paid: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
    };
  }
}
