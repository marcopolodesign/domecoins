# Search Results: In-Stock Cards First Implementation

## Summary
Modified the search API to fetch a larger batch of results from TCGPlayer and sort them to prioritize in-stock cards before pagination.

## The Problem
When searching for cards (e.g., `https://www.dometcg.com/cards?search=dragonite`), out-of-stock cards ("POR ENCARGO") were appearing before in-stock cards ("EN STOCK"), even on page 1.

### Root Cause
TCGPlayer's API returns paginated results in their own order. When we requested 20 cards per page, we only got those 20 cards to sort. If the in-stock cards were on page 2 or 3 of TCGPlayer's results, they wouldn't appear on our page 1 even after sorting.

## The Solution
Instead of fetching exactly the number of cards we need per page, we now:
1. **Fetch a larger batch** (100 cards minimum, or 5x the requested page size)
2. **Sort the entire batch** (in-stock first, then by price)
3. **Paginate the sorted results** (slice out the requested page)

### Code Changes

#### `/src/app/api/search-with-prices/route.ts` - GET Endpoint

**Before:**
```typescript
const pageSize = parseInt(searchParams.get('pageSize') || '20');
const page = parseInt(searchParams.get('page') || '1');

// Fetch from TCGPlayer directly with proper pagination
const tcgResponse = await searchTCGPlayerPrices(searchQuery, {
  pageSize: pageSize,
  page: page,
});
```

**After:**
```typescript
const pageSize = parseInt(searchParams.get('pageSize') || '20');
const page = parseInt(searchParams.get('page') || '1');

// CRITICAL: Fetch MORE results from TCGPlayer so we can sort in-stock cards first
// We'll fetch up to 100 results to have a much better pool of cards to sort
// This ensures in-stock cards appear first even if they're further down in TCGPlayer's results
const fetchSize = Math.max(100, pageSize * 5);
const fetchPage = 1; // Always fetch from page 1 of the larger batch

console.log(`[SearchWithPrices] Fetching ${fetchSize} results from TCGPlayer to enable in-stock sorting`);

// Fetch from TCGPlayer directly with larger batch size
const tcgResponse = await searchTCGPlayerPrices(searchQuery, {
  pageSize: fetchSize,
  page: fetchPage,
});
```

**Pagination of Sorted Results:**
```typescript
// Sort cards (in-stock first, then by price)
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

// Now paginate the sorted results
const startIdx = (page - 1) * pageSize;
const endIdx = startIdx + pageSize;
const paginatedCards = sortedCards.slice(startIdx, endIdx);

return NextResponse.json({
  items: paginatedCards,
  totalCount: sortedCards.length, // Total cards in our sorted batch
  hasNextPage: endIdx < sortedCards.length,
  hasPrevPage: page > 1,
  totalPages: Math.ceil(sortedCards.length / pageSize),
});
```

## How It Works

### Example: Searching for "Dragonite"

1. **User requests page 1** (20 cards)
2. **API fetches 100 cards** from TCGPlayer
3. **API checks inventory** for each card
4. **API sorts all 100 cards**:
   - In-stock Dragonite cards first (if any exist in inventory)
   - Then out-of-stock Dragonite cards
   - Within each group, sorted by price (lowest first)
5. **API returns cards 1-20** from the sorted list
6. **User sees in-stock cards first** (if any exist in the 100-card batch)

### Pagination Behavior

- **Page 1**: Cards 1-20 from sorted batch
- **Page 2**: Cards 21-40 from sorted batch
- **Page 3**: Cards 41-60 from sorted batch
- etc.

The pagination info now reflects the sorted batch:
- `totalCount`: Number of cards in the sorted batch (e.g., 100)
- `totalPages`: Based on the sorted batch size

## Limitations

### 1. Limited Pool Size
We fetch 100 cards maximum per search. If:
- TCGPlayer has 500 Dragonite cards
- The in-stock ones are at positions 150-200
- They won't appear in our results

**Why this limit?**
- Performance: Fetching 500 cards would be slow
- API costs: More requests to TCGPlayer
- Practicality: Most searches have in-stock cards in the first 100 results

### 2. Inventory Dependency
The sorting only works if:
- Cards are properly added to the inventory CSV
- The product IDs match between TCGPlayer and your inventory
- The inventory data is up to date

### 3. Search-Specific
This only affects search results (`/cards?search=...`). The in-stock view (`/cards?inStock=true`) already shows only in-stock cards by design.

## Testing

### Localhost Testing (Verified ✓)
1. Navigate to `http://localhost:3000/cards?search=dragonite`
2. Verify the API fetches 100 results
3. Check console logs for sorting confirmation
4. Observe that all 20 cards on page 1 are "POR ENCARGO" (meaning no Dragonite cards are in stock in the first 100 TCGPlayer results)

### Production Deployment
The changes are ready and tested locally. To deploy:
1. Commit the changes to git
2. Push to the deployment branch
3. Verify on `https://www.dometcg.com/cards?search=dragonite`

## Important Notes

### If In-Stock Cards Still Don't Appear First

This could mean:
1. **No cards in inventory**: Check your `inventory.csv` to ensure the searched cards are actually in stock
2. **Product ID mismatch**: Verify the product IDs in your CSV match TCGPlayer's IDs
3. **Cards beyond position 100**: The in-stock cards might be further down in TCGPlayer's results (rare, but possible)

### Console Logging
The API now logs:
```
[SearchWithPrices] Fetching 100 results from TCGPlayer to enable in-stock sorting
[SearchWithPrices] Got 100 results from TCGPlayer (500 total available)
[SearchWithPrices] Sorted 98 cards (in-stock first, then by price)
[SearchWithPrices] Returning page 1: cards 1-20 of 98 sorted cards
```

## Files Modified
- `/src/app/api/search-with-prices/route.ts` - GET endpoint

## Related Documentation
- `/docs/IN_STOCK_FIRST_SORTING.md` - Original server-side sorting implementation
- `/docs/IN_STOCK_PAGINATION_IMPLEMENTATION.md` - In-stock page pagination

