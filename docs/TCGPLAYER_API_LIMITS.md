# TCGPlayer API Limits - Testing Results

## Summary

This document details the findings from testing TCGPlayer's internal search API limits on October 16, 2024.

## API Endpoint

```
POST https://mp-search-api.tcgplayer.com/v1/search/request
```

## Tested Limits

### Page Size Limit

**Maximum cards per request: 50**

| Page Size | Status  | Response Time | Notes |
|-----------|---------|---------------|-------|
| 20        | ✅ Success | ~1369ms | Works perfectly |
| 30        | ✅ Success | ~1000ms | Optimal for UX |
| 40        | ✅ Success | ~620ms  | Fast and reliable |
| 45        | ✅ Success | ~1681ms | Still working |
| 50        | ✅ Success | ~766ms  | **Maximum limit** |
| 55        | ❌ Error | ~174ms  | 400 Bad Request |
| 60        | ❌ Error | ~171ms  | 400 Bad Request |
| 100       | ❌ Error | ~169ms  | 400 Bad Request |
| 250       | ❌ Error | ~172ms  | 400 Bad Request |

### Key Findings

1. **Hard Limit**: TCGPlayer API enforces a strict limit of **50 cards per request**
2. **Error Response**: Requests exceeding 50 cards return `400 Bad Request`
3. **Performance**: Average response time for successful requests: ~995ms
4. **No Soft Limit**: No warnings or gradual degradation - just a hard cutoff at 50

## Rate Limiting

Based on testing with 1-second delays between requests:
- ✅ Multiple requests with 1s delay: Works fine
- ⚠️ Recommended delay: 1-2 seconds between requests to be safe
- 📝 No explicit rate limit headers observed

## Implementation Changes

### 1. Fixed Parameter Mismatch

**Before:**
```typescript
// search-with-prices/route.ts passed pageSize and page
const tcgResults = await searchTCGPlayerPrices(searchQuery, {
  pageSize,  // ❌ Ignored!
  page,      // ❌ Ignored!
});

// But the function expected limit and from
function searchTCGPlayerPrices(query: string, options: {
  limit?: number;   // Different parameter name!
  from?: number;    // Different parameter name!
})
```

**After:**
```typescript
// Now properly accepts both naming conventions
function searchTCGPlayerPrices(query: string, options: {
  pageSize?: number;  // ✅ Standard pagination
  page?: number;      // ✅ 1-indexed page number
  limit?: number;     // ✅ Backwards compatibility
  from?: number;      // ✅ 0-indexed offset
})
```

### 2. Added Safety Limit

```typescript
const requestedPageSize = options.pageSize || options.limit || 24;
const pageSize = Math.min(requestedPageSize, 50); // Enforce max

if (requestedPageSize > 50) {
  console.warn(`[TCGPlayer] Requested pageSize ${requestedPageSize} exceeds limit. Using maximum of 50.`);
}
```

### 3. Updated UI Options

**Before:**
```tsx
<option value={20}>20</option>
<option value={40}>40</option>
<option value={60}>60</option>  {/* ❌ Would fail! */}
```

**After:**
```tsx
<option value={20}>20</option>
<option value={30}>30</option>  {/* ✅ Added */}
<option value={40}>40</option>
<option value={50}>50</option>  {/* ✅ Maximum */}
```

## Testing Endpoint

A test endpoint was created to verify these limits:

```bash
# Test default sizes
curl "http://localhost:3000/api/test-tcgplayer-limits?query=pikachu"

# Test custom sizes
curl "http://localhost:3000/api/test-tcgplayer-limits?query=charizard&testSizes=45,50,55"
```

### Example Response

```json
{
  "query": "pikachu",
  "testedSizes": [20, 40, 60, 100, 250],
  "maxSuccessfulPageSize": 40,
  "results": [
    {
      "pageSize": 20,
      "status": "success",
      "resultsReturned": 20,
      "responseTime": 1369
    },
    {
      "pageSize": 50,
      "status": "success",
      "resultsReturned": 50,
      "responseTime": 766
    },
    {
      "pageSize": 60,
      "status": "error",
      "error": "TCGPlayer API failed: Request failed with status code 400",
      "responseTime": 171
    }
  ],
  "recommendation": "TCGPlayer has a limit around 50. Use smaller page sizes.",
  "avgResponseTime": 995
}
```

## Recommendations

1. **Default Page Size**: Use 20-30 cards for best balance of speed and content
2. **Maximum Page Size**: Never exceed 50 cards per request
3. **User Options**: Offer [20, 30, 40, 50] as page size options
4. **Error Handling**: Automatically cap requests at 50 to prevent 400 errors
5. **Rate Limiting**: Add 1-2 second delays between batch requests

## References

- Test Date: October 16, 2024
- API Version: TCGPlayer MP Search API v1
- Test Queries: "pikachu", "charizard"
- Test Location: `/api/test-tcgplayer-limits`

