# Rarity Debugging Guide

## ✅ ISSUE RESOLVED!

The rarity **IS** being returned by TCGPlayer's API in the `rarityName` field. The extraction logic has been updated and verified.

### Example TCGPlayer Response:
```json
{
  "rarityName": "Rare",
  "customAttributes": {
    "rarityDbName": "Rare",
    ...
  }
}
```

## Changes Made

I've added comprehensive debugging to track down where the rarity data is being lost:

### 1. Enhanced Rarity Extraction (`src/lib/tcgplayer-price-scraper.ts`)

**Lines 134-150**: Added multiple fallback checks for rarity:
```typescript
const rarity = product.rarityName || 
               product.rarity || 
               product.extendedData?.find((d: any) => d.name === 'Rarity')?.value ||
               product.customAttributes?.rarity ||
               undefined;
```

This checks:
- `product.rarityName` (primary field)
- `product.rarity` (alternative field)
- `product.extendedData` array for a Rarity field
- `product.customAttributes.rarity`

**Line 124**: Added full product structure logging to see the exact API response format:
```typescript
console.log('[TCGPlayer] FULL FIRST PRODUCT STRUCTURE:', JSON.stringify(products[0], null, 2));
```

**Lines 142-151**: Added detailed debug logging for the first product showing all possible rarity fields.

### 2. Fixed Mapping in Search API (`src/app/api/search-with-prices/route.ts`)

**Line 68**: Changed from `priceData.rarityName` to `priceData.rarity` to match the interface:
```typescript
rarity: priceData.rarity || 'Unknown',
```

**Lines 50-56**: Added logging to verify rarity is being passed through correctly.

## How to Test

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open the browser console** (F12 or Cmd+Option+I on Mac)

3. **Navigate to the cards page** (`/cards`) or search for a Pokemon

4. **Check the console logs** for:
   - `[TCGPlayer] FULL FIRST PRODUCT STRUCTURE:` - This will show the COMPLETE structure of the first product from TCGPlayer's API
   - `[TCGPlayer] First product structure check:` - Shows which rarity fields exist
   - `[SearchWithPrices] First card rarity check:` - Shows if rarity made it through to the API response

## What to Look For

### In the Console Logs:

1. **Full Product Structure** - Look for where the rarity actually lives in the TCGPlayer response:
   ```json
   {
     "productId": 12345,
     "productName": "Pikachu",
     "rarityName": "Rare Holo",  ← Look for this
     "rarity": "Rare Holo",       ← Or this
     "extendedData": [...],       ← Or check inside here
     "customAttributes": {...}     ← Or inside here
   }
   ```

2. **Extraction Check** - Verify the extracted rarity:
   ```
   [TCGPlayer] First product structure check: {
     rarityName: "Rare Holo",
     extractedRarity: "Rare Holo"
   }
   ```

3. **Final API Response** - Confirm it's in the final response:
   ```
   [SearchWithPrices] First card rarity check: {
     productName: "Pikachu",
     rarity: "Rare Holo",
     hasRarity: true
   }
   ```

## Possible Issues & Solutions

### Issue 1: Rarity is in a different field
**Solution**: Once we see the full product structure, we can adjust the extraction logic to use the correct field name.

### Issue 2: Rarity requires additional API call
**Solution**: TCGPlayer might not include rarity in the search results. We may need to fetch individual product details to get rarity information.

### Issue 3: Rarity is in extendedData array
**Solution**: The code already checks for this, but we can refine it based on the actual structure.

## Next Steps

After running a search and seeing the logs:

1. **Share the console output** showing the `FULL FIRST PRODUCT STRUCTURE`
2. Based on that structure, I can adjust the extraction logic to correctly pull the rarity
3. If rarity isn't in the search API response, we may need to:
   - Use a different TCGPlayer API endpoint
   - Make individual product detail requests
   - Use the aggregations/facets from the search response

## Interface Definition

The rarity is defined in the TCGPlayerPrice interface (`src/lib/tcgplayer-price-scraper.ts`):
```typescript
export interface TCGPlayerPrice {
  rarity?: string;  // Optional because it might not always be available
  // ... other fields
}
```

This is then mapped to the card's `rarity` field in the search-with-prices API.

