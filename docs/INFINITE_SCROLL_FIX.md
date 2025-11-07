# Infinite Scroll Fix for In-Stock Cards Page

## Problem
The infinite scroll feature on `/cards?inStock=true` was not working. The page would load only the first 20 cards and would not load more cards when scrolling to the bottom, despite showing "Cartas en Stock (1686)" indicating there were many more cards available.

## Root Cause
The `IntersectionObserver` cleanup function in the `useEffect` hook had a stale closure issue. The cleanup was trying to unobserve `observerTarget.current`, but by the time the cleanup function ran, the ref value might have changed, causing the observer to not properly clean up or re-initialize.

Additionally, the `loadCardBatch` function was not memoized with `useCallback`, which could cause unnecessary re-renders and observer re-initializations.

## Solution

### 1. Fixed Observer Cleanup (Stale Closure Issue)
**Before:**
```typescript
useEffect(() => {
  // ... setup code
  observer.observe(observerTarget.current)

  return () => {
    if (observerTarget.current) {
      observer.unobserve(observerTarget.current) // ❌ Stale ref
    }
  }
}, [dependencies])
```

**After:**
```typescript
useEffect(() => {
  // ... setup code
  const currentTarget = observerTarget.current // ✅ Capture ref value

  observer.observe(currentTarget)

  return () => {
    if (currentTarget) {
      observer.unobserve(currentTarget) // ✅ Use captured value
    }
  }
}, [dependencies])
```

### 2. Memoized loadCardBatch Function
**Before:**
```typescript
const loadCardBatch = async (allIds: string[], batchIndex: number) => {
  // ... implementation
}
```

**After:**
```typescript
const loadCardBatch = useCallback(async (allIds: string[], batchIndex: number) => {
  // ... implementation
}, [CARDS_PER_BATCH])
```

## How It Works Now

1. **Initial Load**: When the page loads with `?inStock=true`, it:
   - Fetches all in-stock product IDs from `/api/inventory`
   - Loads the first batch of 20 cards
   - Sets up the `IntersectionObserver` to watch the observer target element

2. **Infinite Scroll**: When the user scrolls to the bottom:
   - The observer target element (`<div ref={observerTarget}>`) comes into view
   - The `IntersectionObserver` callback fires
   - It checks if we're not already loading and if there are more cards
   - Calls `loadCardBatch` with the next batch index
   - Displays a loading indicator ("Cargando más cartas...")
   - Appends the new 20 cards to the existing list

3. **End of Results**: When all cards have been loaded:
   - `hasMoreCards` becomes `false`
   - The observer target is no longer rendered
   - An "end of results" message is shown

## Testing

To verify the fix works:

1. Navigate to https://www.dometcg.com/cards?inStock=true
2. Verify that 20 cards load initially
3. Scroll to the bottom of the page
4. Verify that a loading indicator appears ("Cargando más cartas...")
5. Verify that 20 more cards load
6. Repeat scrolling to load more batches
7. Verify that after all 1686 cards are loaded, an "end of results" message appears

## Files Modified

- `/src/app/cards/page.tsx`:
  - Fixed `IntersectionObserver` cleanup to capture the ref value
  - Wrapped `loadCardBatch` in `useCallback` for proper memoization
  - Added `loadCardBatch` to the `useEffect` dependency array

## Technical Details

### Why the Stale Closure Was a Problem
React refs can change between renders. When the cleanup function runs (e.g., when dependencies change), it might try to unobserve a different element than the one that was originally observed, or the ref might be `null`. By capturing the ref value at the time the observer is created, we ensure the cleanup function unobserves the correct element.

### Why useCallback Was Needed
Without `useCallback`, the `loadCardBatch` function would be recreated on every render. Since it's now in the `useEffect` dependency array, this would cause the observer to be torn down and recreated on every render, which is inefficient and could cause bugs.

## Performance Considerations

- **Batch Size**: 20 cards per batch is a good balance between network requests and user experience
- **Threshold**: The observer uses a `threshold` of `0.1`, meaning it triggers when 10% of the target element is visible
- **Debouncing**: The `isLoadingMore` flag prevents multiple simultaneous requests

## Future Improvements

Possible enhancements:
1. Add a "Load More" button as a fallback for users who prefer manual control
2. Implement virtual scrolling for better performance with thousands of cards
3. Add a "Back to Top" button for easier navigation
4. Cache loaded batches to avoid re-fetching when navigating back

