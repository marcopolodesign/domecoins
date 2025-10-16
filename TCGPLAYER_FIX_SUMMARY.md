# TCGPlayer Pagination Fix - Summary

## Problem Identified

The application was **always returning 24 cards** regardless of the user's page size selection (20/40/60). This was due to a **parameter name mismatch** between the API route and the scraper function.

### Root Cause

```typescript
// ❌ API Route was passing: pageSize, page
const tcgResults = await searchTCGPlayerPrices(searchQuery, {
  pageSize,  // Parameter name: pageSize
  page,      // Parameter name: page
});

// ❌ But function was expecting: limit, from
function searchTCGPlayerPrices(query: string, options: {
  limit?: number,   // Expected: limit (not pageSize)
  from?: number     // Expected: from (not page)
})

// Result: Parameters were ignored, defaulted to limit=24
```

## Solution Implemented

### 1. Fixed Function Signature
- Now accepts both naming conventions: `pageSize/page` AND `limit/from`
- Automatically converts between them
- Maintains backwards compatibility

### 2. Discovered TCGPlayer API Limits
Through systematic testing, we found:
- ✅ **Maximum: 50 cards per request**
- ❌ **Above 50: Returns 400 Bad Request**
- ⚡ **Performance: ~1000ms average response time**

### 3. Added Safety Features
- Automatic capping at 50 cards (prevents API errors)
- Warning logs when requests exceed the limit
- Updated UI to show only valid options: [20, 30, 40, 50]

## Testing Results

### Before Fix
```bash
# User selects 40 cards
curl "/api/search-with-prices?pageSize=40"
# Returns: 24 cards (always!)
```

### After Fix
```bash
# User selects 30 cards
curl "/api/search-with-prices?pageSize=30"
# Returns: 30 cards ✅

# User selects 50 cards
curl "/api/search-with-prices?pageSize=50"
# Returns: 50 cards ✅

# User somehow requests 100 cards
curl "/api/search-with-prices?pageSize=100"
# Returns: 50 cards (safely capped) ✅
```

## Files Modified

1. **`src/lib/tcgplayer-price-scraper.ts`**
   - Updated function signature to accept `pageSize` and `page`
   - Added 50-card safety cap
   - Improved documentation with tested limits

2. **`src/app/api/search-with-prices/route.ts`**
   - Added debug logging for pagination parameters
   - Properly passes `pageSize` and `page` to scraper

3. **`src/app/cards/page.tsx`**
   - Updated page size options: [20, 30, 40, 50]
   - Removed invalid option (60)
   - Added tooltip explaining the limit

4. **`src/app/api/test-tcgplayer-limits/route.ts`** (NEW)
   - Testing endpoint to verify API limits
   - Can test any page sizes
   - Returns detailed performance metrics

## Documentation Created

- **`docs/TCGPLAYER_API_LIMITS.md`** - Detailed testing results and findings
- **`TCGPLAYER_FIX_SUMMARY.md`** - This summary document

## Verification Commands

```bash
# Test the fix with different page sizes
curl "http://localhost:3000/api/search-with-prices?query=pikachu&pageSize=20" | jq '.items | length'
curl "http://localhost:3000/api/search-with-prices?query=pikachu&pageSize=30" | jq '.items | length'
curl "http://localhost:3000/api/search-with-prices?query=pikachu&pageSize=50" | jq '.items | length'

# Test the limits endpoint
curl "http://localhost:3000/api/test-tcgplayer-limits?query=charizard&testSizes=40,50,60" | jq
```

## Impact

✅ **User Experience**
- Page size selector now works as expected
- Users can view 20, 30, 40, or 50 cards per page
- No more confusion about why 60 cards option didn't work

✅ **Reliability**
- Prevents API errors from oversized requests
- Automatic safety capping
- Better error handling

✅ **Performance**
- Users can choose optimal page size for their needs
- Faster loads with smaller page sizes (20-30)
- More content with larger sizes (40-50)

## Next Steps (Optional)

1. Monitor logs for requests hitting the 50-card cap
2. Consider adding pagination indicators showing card range (e.g., "Cards 1-30 of 500")
3. Add infinite scroll option as an alternative to pagination
4. Cache results to reduce API calls

## Testing Checklist

- [x] Fix parameter mismatch
- [x] Test page sizes: 20, 30, 40, 50
- [x] Test limit enforcement (50 max)
- [x] Test oversized requests (100+) are capped
- [x] Update UI page size options
- [x] Add documentation
- [x] Verify no linter errors
- [x] Create test endpoint

**Status: ✅ COMPLETE**

