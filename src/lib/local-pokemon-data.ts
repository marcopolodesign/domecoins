import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'pokemon-tcg');

export interface LocalCard {
  id: string;
  name: string;
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url?: string;
    prices?: any;
  };
  set: {
    id: string;
    name: string;
  };
  rarity?: string;
  types?: string[];
  hp?: string;
  attacks?: any[];
  weaknesses?: any[];
  resistances?: any[];
  nationalPokedexNumbers?: number[];
}

// Search local cards data
export async function searchLocalCards(
  query: string,
  filters: {
    pageSize?: number;
    page?: number;
    set?: string;
    types?: string[];
    rarity?: string;
  } = {}
): Promise<{
  data: LocalCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}> {
  try {
    let allCards: LocalCard[] = [];
    
    // Try to load cards-all.json if it exists
    const allCardsPath = path.join(DATA_DIR, 'cards-all.json');
    
    if (fs.existsSync(allCardsPath)) {
      const cardsData = fs.readFileSync(allCardsPath, 'utf-8');
      allCards = JSON.parse(cardsData);
    } else {
      // Fallback: load any available card files
      console.log('cards-all.json not found, loading available card files...');
      const files = fs.readdirSync(DATA_DIR);
      const cardFiles = files.filter(f => f.endsWith('.json') && f.includes('full'));
      
      for (const file of cardFiles) {
        try {
          const filePath = path.join(DATA_DIR, file);
          const fileData = fs.readFileSync(filePath, 'utf-8');
          const cards = JSON.parse(fileData);
          if (Array.isArray(cards)) {
            allCards = allCards.concat(cards);
          }
        } catch (err) {
          console.error(`Error loading ${file}:`, err);
        }
      }
      
      if (allCards.length === 0) {
        throw new Error('No local cards data found. Run sync script first.');
      }
    }
    
    // Filter cards by query (case-insensitive name match)
    let filteredCards = allCards.filter((card) =>
      card.name.toLowerCase().includes(query.toLowerCase())
    );
    
    // Apply additional filters
    if (filters.set) {
      filteredCards = filteredCards.filter((card) => card.set.id === filters.set);
    }
    
    if (filters.types && filters.types.length > 0) {
      filteredCards = filteredCards.filter((card) =>
        card.types?.some((type) => filters.types!.includes(type))
      );
    }
    
    if (filters.rarity) {
      filteredCards = filteredCards.filter((card) => card.rarity === filters.rarity);
    }
    
    // Pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedCards = filteredCards.slice(startIndex, endIndex);
    
    return {
      data: paginatedCards,
      page,
      pageSize,
      count: paginatedCards.length,
      totalCount: filteredCards.length,
    };
  } catch (error) {
    console.error('Error searching local cards:', error);
    throw error;
  }
}

// Get local sets
export function getLocalSets() {
  try {
    const setsPath = path.join(DATA_DIR, 'sets.json');
    
    if (!fs.existsSync(setsPath)) {
      throw new Error('Local sets data not found.');
    }
    
    const setsData = fs.readFileSync(setsPath, 'utf-8');
    return JSON.parse(setsData);
  } catch (error) {
    console.error('Error loading local sets:', error);
    throw error;
  }
}

// Check if local data is available
export function hasLocalData(): boolean {
  const allCardsPath = path.join(DATA_DIR, 'cards-all.json');
  if (fs.existsSync(allCardsPath)) {
    return true;
  }
  
  // Check for any *-full.json files as fallback
  try {
    const files = fs.readdirSync(DATA_DIR);
    return files.some(f => f.endsWith('.json') && f.includes('full'));
  } catch {
    return false;
  }
}

