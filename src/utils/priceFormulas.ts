/**
 * Price Formula System for Pokemon TCG Cards
 * 
 * Calculates final retail prices based on rarity and TCGPlayer market price
 * Formula: Each rarity has specific markup rules and minimum prices
 * 
 * M = marketPrice (from TCGPlayer)
 */

export interface PriceCalculation {
  marketPrice: number;
  calculatedPrice: number;
  finalPrice: number;
  formula: string;
  minimumApplied: boolean;
}

/**
 * Calculate final retail price based on rarity and market price
 * @param rarity - Card rarity (e.g., "Ultra Rare", "Common", etc.)
 * @param marketPrice - TCGPlayer market price in USD
 * @returns Final price in USD
 */
export function calculateFinalPrice(rarity: string, marketPrice: number): number {
  const calculation = calculatePriceWithDetails(rarity, marketPrice);
  return calculation.finalPrice;
}

/**
 * Calculate final price with detailed breakdown
 * @param rarity - Card rarity
 * @param marketPrice - TCGPlayer market price in USD
 * @returns Detailed price calculation
 */
export function calculatePriceWithDetails(rarity: string, marketPrice: number): PriceCalculation {
  // Normalize rarity string
  const normalizedRarity = rarity.trim();
  
  // GRUPO 1: Common/Uncommon - M × 1.25 (Mínimo: $0.3)
  if (['Common', 'Uncommon'].includes(normalizedRarity)) {
    const calculatedPrice = marketPrice * 1.25;
    const finalPrice = Math.max(0.3, calculatedPrice);
    return {
      marketPrice,
      calculatedPrice,
      finalPrice,
      formula: 'M × 1.25',
      minimumApplied: finalPrice === 0.3 && calculatedPrice < 0.3,
    };
  }

  // GRUPO 5: Black White Rare, Mega Hyper Rare - M × 1.1 (Sin mínimo)
  if (['Black White Rare', 'Mega Hyper Rare'].includes(normalizedRarity)) {
    const calculatedPrice = marketPrice * 1.1;
    return {
      marketPrice,
      calculatedPrice,
      finalPrice: calculatedPrice,
      formula: 'M × 1.1',
      minimumApplied: false,
    };
  }

  // GRUPO 4: Premium con escala completa (5 niveles)
  const premiumRarities: Record<string, number> = {
    'Ultra Rare': 1.5,
    'Double Rare': 1.5,
    'Secret Rare': 2,
    'Illustration Rare': 2.5,
    'Shiny Holo Rare': 2,
    'Special Illustration Rare': 3,
    'Shiny Rare': 2,
    'Hyper Rare': 2,
  };

  if (normalizedRarity in premiumRarities) {
    let multiplier = 1.35;
    let formulaDesc = '(M + 0.4) × 1.35';
    
    if (marketPrice > 100) {
      multiplier = 1.10;
      formulaDesc = '(M + 0.4) × 1.10';
    } else if (marketPrice > 70) {
      multiplier = 1.15;
      formulaDesc = '(M + 0.4) × 1.15';
    } else if (marketPrice > 40) {
      multiplier = 1.20;
      formulaDesc = '(M + 0.4) × 1.20';
    } else if (marketPrice > 20) {
      multiplier = 1.25;
      formulaDesc = '(M + 0.4) × 1.25';
    }
    
    const calculatedPrice = (marketPrice + 0.4) * multiplier;
    const minimumPrice = premiumRarities[normalizedRarity];
    const finalPrice = Math.max(minimumPrice, calculatedPrice);
    
    return {
      marketPrice,
      calculatedPrice,
      finalPrice,
      formula: formulaDesc,
      minimumApplied: finalPrice === minimumPrice && calculatedPrice < minimumPrice,
    };
  }

  // GRUPO 3: Promo (2 escalas)
  if (normalizedRarity === 'Promo') {
    const multiplier = marketPrice > 20 ? 1.25 : 1.35;
    const formulaDesc = marketPrice > 20 ? '(M + 0.4) × 1.25' : '(M + 0.4) × 1.35';
    const calculatedPrice = (marketPrice + 0.4) * multiplier;
    const finalPrice = Math.max(1, calculatedPrice);
    
    return {
      marketPrice,
      calculatedPrice,
      finalPrice,
      formula: formulaDesc,
      minimumApplied: finalPrice === 1 && calculatedPrice < 1,
    };
  }

  // GRUPO 2: Cartas estándar - (M + 0.4) × 1.25
  const standardRarities: Record<string, number> = {
    'Rare': 1,
    'Holo Rare': 1,
    'ACE SPEC Rare': 1.5,
    'Prism Rare': 1.5,
    'Radiant Rare': 2,
    'Rare BREAK': 2,
    'Rare Ace': 1.5,
    'Shiny Ultra Rare': 2,
    'Amazing Rare': 2,
    'Classic Collection': 2,
  };

  if (normalizedRarity in standardRarities) {
    const calculatedPrice = (marketPrice + 0.4) * 1.25;
    const minimumPrice = standardRarities[normalizedRarity];
    const finalPrice = Math.max(minimumPrice, calculatedPrice);
    
    return {
      marketPrice,
      calculatedPrice,
      finalPrice,
      formula: '(M + 0.4) × 1.25',
      minimumApplied: finalPrice === minimumPrice && calculatedPrice < minimumPrice,
    };
  }

  // SPECIAL CASES
  if (normalizedRarity === 'Code Card') {
    return {
      marketPrice,
      calculatedPrice: 0,
      finalPrice: 0,
      formula: 'N/A (not for sale)',
      minimumApplied: false,
    };
  }

  if (normalizedRarity === 'Unconfirmed') {
    return {
      marketPrice,
      calculatedPrice: marketPrice,
      finalPrice: marketPrice,
      formula: 'M (unconfirmed rarity)',
      minimumApplied: false,
    };
  }

  // DEFAULT: Return market price if rarity not found
  console.warn(`[PriceFormulas] Unknown rarity: "${normalizedRarity}", using market price`);
  return {
    marketPrice,
    calculatedPrice: marketPrice,
    finalPrice: marketPrice,
    formula: 'M (unknown rarity)',
    minimumApplied: false,
  };
}

/**
 * Get all supported rarities
 */
export function getSupportedRarities(): string[] {
  return [
    // Group 1
    'Common',
    'Uncommon',
    // Group 2
    'Rare',
    'Holo Rare',
    'ACE SPEC Rare',
    'Prism Rare',
    'Radiant Rare',
    'Rare BREAK',
    'Rare Ace',
    'Shiny Ultra Rare',
    'Amazing Rare',
    'Classic Collection',
    // Group 3
    'Promo',
    // Group 4
    'Ultra Rare',
    'Double Rare',
    'Secret Rare',
    'Illustration Rare',
    'Shiny Holo Rare',
    'Special Illustration Rare',
    'Shiny Rare',
    'Hyper Rare',
    // Group 5
    'Black White Rare',
    'Mega Hyper Rare',
    // Special
    'Code Card',
    'Unconfirmed',
  ];
}

/**
 * Get minimum price for a rarity
 */
export function getMinimumPrice(rarity: string): number | null {
  const minimums: Record<string, number> = {
    'Common': 0.3,
    'Uncommon': 0.3,
    'Rare': 1,
    'Holo Rare': 1,
    'ACE SPEC Rare': 1.5,
    'Prism Rare': 1.5,
    'Radiant Rare': 2,
    'Rare BREAK': 2,
    'Rare Ace': 1.5,
    'Shiny Ultra Rare': 2,
    'Amazing Rare': 2,
    'Classic Collection': 2,
    'Promo': 1,
    'Ultra Rare': 1.5,
    'Double Rare': 1.5,
    'Secret Rare': 2,
    'Illustration Rare': 2.5,
    'Shiny Holo Rare': 2,
    'Special Illustration Rare': 3,
    'Shiny Rare': 2,
    'Hyper Rare': 2,
  };

  return minimums[rarity.trim()] || null;
}

