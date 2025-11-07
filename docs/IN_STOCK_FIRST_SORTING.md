# In-Stock First Sorting Implementation

## Problem
When searching for cards (e.g., "dragonite"), out-of-stock cards ("POR ENCARGO") were appearing before in-stock cards ("EN STOCK"), even on page 2 where in-stock cards existed. This was confusing for customers who expect to see available inventory first.

## Root Cause
The sorting was happening in two places, but not comprehensively:
1. **Client-side**: The frontend was sorting cards, but only within the cards already loaded on the current page
2. **API**: The backend wasn't sorting at all - it was returning cards in the order received from TCGPlayer

Since TCGPlayer's API returns paginated results (max 50 per request) sorted by their own criteria (relevance, price, etc.), we were getting:
- Page 1: Cards 1-20 from TCGPlayer (sorted by TCGPlayer's algorithm)
- Page 2: Cards 21-40 from TCGPlayer (sorted by TCGPlayer's algorithm)

The in-stock status wasn't being considered in the sort order until after pagination.

## Solution Implemented

### 1. Backend API Sorting (Primary Fix)
Added sorting logic in `/src/app/api/search-with-prices/route.ts` for both GET and POST endpoints:

```typescript
// CRITICAL: Sort cards with IN STOCK ALWAYS FIRST, then by price
const sortedCards = filteredCards.sort((a, b) => {
  // First priority: in-stock cards ALWAYS at top
  const aInStock = a.inStock || false;
  const bInStock = b.inStock || false;
  
  if (aInStock && !bInStock) return -1;
  if (!aInStock && bInStock) return 1;
  
  // Second priority: sort by price (lowest first)
  const aPrice = a.pricing?.retailPrice || a.pricing?.marketPrice || 0;
  const bPrice = b.pricing?.retailPrice || b.pricing?.marketPrice || 0;
  
  return aPrice - bPrice;
});
```

This ensures that:
- **Within each page** of results, in-stock cards appear first
- After in-stock sorting, cards are sorted by price (lowest to highest)
- This applies to both the GET endpoint (search) and POST endpoint (in-stock only view)

### 2. Client-Side Sorting (Enhanced)
Updated `/src/app/cards/page.tsx` to use `retailPrice` instead of `marketPrice` for consistency:

```typescript
// Sort cards
filtered.sort((a, b) => {
  // First priority: in-stock cards ALWAYS at top
  const aInStock = 'inStock' in a ? a.inStock : false
  const bInStock = 'inStock' in b ? b.inStock : false
  
  if (aInStock && !bInStock) return -1
  if (!aInStock && bInStock) return 1
  
  // Second priority: apply price sort order (use retailPrice which is what we display)
  const aPrice = a.pricing?.retailPrice || a.pricing?.marketPrice || 0
  const bPrice = b.pricing?.retailPrice || b.pricing?.marketPrice || 0
  
  if (sortOrder === 'Precio: Menor a mayor') {
    return aPrice - bPrice
  } else if (sortOrder === 'Precio: Mayor a menor') {
    return bPrice - aPrice
  }
  
  return 0
})
```

This ensures:
- Client-side filtering/sorting respects the user's sort order preference
- In-stock cards ALWAYS appear first, regardless of sort order
- The displayed price (`retailPrice`) is used for sorting

## Limitations & Trade-offs

### Why Not Sort ALL Results Before Pagination?
To sort ALL results before pagination, we would need to:
1. Fetch ALL matching cards from TCGPlayer (could be hundreds)
2. Check inventory status for each
3. Sort the complete list
4. Then paginate

This approach has significant drawbacks:
- **Slow**: TCGPlayer limits requests to 50 cards max, so we'd need multiple sequential requests
- **Expensive**: More API calls = higher costs and rate limit risks
- **Poor UX**: Users would wait longer for initial results
- **Unnecessary**: Most users don't browse beyond the first few pages

### Current Behavior (Acceptable)
With the current implementation:
- **Page 1**: Shows first 20 results from TCGPlayer, with in-stock cards sorted to the top
- **Page 2**: Shows next 20 results from TCGPlayer, with in-stock cards sorted to the top
- **Page N**: Same pattern

This means:
- ✅ In-stock cards ALWAYS appear before out-of-stock cards **on the same page**
- ✅ Fast response times (no need to fetch all results)
- ⚠️ An in-stock card on page 2 might have a lower price than an out-of-stock card on page 1
- ⚠️ Users need to browse multiple pages to see all in-stock options

## Alternative: "In Stock Only" View
For customers who ONLY want to see available inventory, we have the `/cards?inStock=true` view which:
1. Fetches ALL product IDs from inventory
2. Loads cards in batches (infinite scroll)
3. Shows ONLY in-stock cards, sorted by price

This is the recommended view for customers ready to purchase.

## Testing
To verify the fix works:
1. Deploy the changes to production
2. Search for "dragonite" at https://www.dometcg.com/cards?search=dragonite
3. Verify that on each page, "EN STOCK" cards appear before "POR ENCARGO" cards
4. Navigate through pages and confirm the pattern holds
5. Test the price sort dropdown - in-stock should still come first

## Files Modified
- `/src/app/api/search-with-prices/route.ts` - Added sorting to both GET and POST endpoints
- `/src/app/cards/page.tsx` - Updated client-side sorting to use retailPrice

## Deployment
After deploying these changes, the sorting will take effect immediately for all searches and card browsing.

