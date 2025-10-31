# Accessories Page - Implementation Guide

## Overview

The `/accessories` page displays all accessories uploaded via the admin panel in a searchable, sortable product grid. It reuses the same `ProductCard` component as the cards page for consistency.

## Page Location

- **URL**: `/accessories`
- **File**: `/src/app/accessories/page.tsx`
- **Navigation**: Header → "Accesorios" link

## Features

### 1. Data Fetching
- Fetches accessories from `/api/accessories` on page mount
- No pagination (displays all accessories at once)
- No TCG API calls - all data comes from CSV upload

### 2. Search & Filter
- **Real-time search** across:
  - Product name
  - Category/Set name
  - Product line (rarity field)
  - Title
- **Search chip** displays active search term
- **Clear button** to reset search

### 3. Sorting
- **Precio: Menor a mayor** (Price: Low to High)
- **Precio: Mayor a menor** (Price: High to Low)
- In-stock items always appear first

### 4. Stock Status
- **Green dot + "EN STOCK"** for available items
- **Yellow dot + "POR ENCARGO"** for out-of-stock items
- Stock quantity displayed when available

### 5. Responsive Design
- **Mobile**: Single column grid with mobile search box
- **Tablet**: 2-column grid
- **Desktop**: 3-column grid
- Adapts filter bar layout for different screen sizes

### 6. Add to Cart
- Direct integration with Redux cart store
- Respects 3-item-per-variant limit
- Auto-opens cart drawer on add
- Toast notifications for success/error

## Data Transformation

Accessories are transformed to match the ProductCard component format:

```typescript
{
  id: accessory.id,              // AC0001
  productId: accessory.id,       // AC0001
  name: accessory.productName,   // "ETB Lucario"
  categoryName: accessory.setName, // "Folio"
  rarity: accessory.productLine, // "Accesorio"
  setId: accessory.number,       // "65"
  imageUrl: accessory.imageUrl,  // Cloudinary URL
  inStock: accessory.addToQuantity > 0,
  stock: accessory.addToQuantity,
  printing: 'Normal',
  pricing: {
    marketPrice: accessory.price || 0,
    retailPrice: accessory.price || 0,
  }
}
```

## Component Structure

```
AccessoriesPage
├── Header Section
│   ├── Title with count
│   └── Description
├── Filter Bar
│   ├── Mobile Search Box
│   ├── Search Chip (when active)
│   └── Controls
│       ├── Search Input
│       └── Sort Dropdown
└── Content Area
    ├── Loading State (6 skeleton cards)
    ├── Error State
    ├── Empty State
    └── Product Grid
        └── ProductCard components
```

## State Management

### Local State
```typescript
const [accessories, setAccessories] = useState<Accessory[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')
const [searchFilter, setSearchFilter] = useState('')
const [sortOrder, setSortOrder] = useState('Precio: Menor a mayor')
```

### Redux State
- `dolarBlueRate` - Current exchange rate for price conversion
- Cart state managed by `cartSlice`

## Styling

### Theme Colors
- **Primary**: Orange (`orange-500`, `orange-600`)
- Matches admin section color scheme
- Distinct from cards page (blue theme)

### Key Classes
- Container: `container-custom`
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Font: `font-thunder` (headers), `font-interphases` (body)

## Loading States

### Initial Load
- 6 skeleton cards with pulsing animation
- Matches ProductCard dimensions (144x201px image)

### Error State
- Red alert box with error message
- Retry button to reload page

### Empty State
- Message varies based on context:
  - No accessories uploaded: "No hay accesorios disponibles"
  - No search results: "No se encontraron accesorios que coincidan con..."
- Clear search button when applicable

## Performance Considerations

1. **Client-side filtering**: All filtering/sorting happens in browser
2. **useMemo hooks**: Prevents unnecessary re-renders
3. **Single API call**: Fetches all data once on mount
4. **No pagination**: Suitable for small to medium catalogs (<100 items)

## Differences from Cards Page

| Feature | Cards Page | Accessories Page |
|---------|-----------|------------------|
| Data Source | TCG API | CSV Upload |
| Pagination | Yes (20 per page) | No (all at once) |
| Infinite Scroll | Yes (in-stock mode) | No |
| API Calls | Multiple (search, prices) | Single (accessories) |
| Theme Color | Blue | Orange |
| Stock Filter | Toggle button | Built into sort |
| URL Params | Yes (search, inStock) | No |

## Integration Points

### Header Navigation
```typescript
const navigation = [
  { name: 'Cartas', href: '/cards?inStock=true' },
  { name: 'Accesorios', href: '/accessories' },
]
```

### ProductCard Component
- Reused without modifications
- Handles both card and accessory data
- Automatic price conversion to ARS
- Stock status display
- Add to cart functionality

### Cart Integration
- Uses same Redux actions as cards
- Respects quantity limits
- Includes in checkout flow
- Displays in cart drawer

## Testing Checklist

- [ ] Upload accessories via admin panel
- [ ] Navigate to `/accessories` page
- [ ] Verify all accessories display
- [ ] Test search functionality
- [ ] Test sort by price (both directions)
- [ ] Test add to cart
- [ ] Verify in-stock vs out-of-stock display
- [ ] Test responsive layouts (mobile, tablet, desktop)
- [ ] Verify price conversion to ARS
- [ ] Test empty state (no accessories)
- [ ] Test error state (API failure)
- [ ] Verify navigation from header

## Future Enhancements

1. **Pagination**: Add if catalog grows large (>50 items)
2. **Category Filters**: Filter by product line or set name
3. **Price Range Filter**: Min/max price sliders
4. **Image Gallery**: Multiple images per accessory
5. **Related Products**: Show related accessories
6. **Quick View**: Modal with full details
7. **Wishlist**: Save accessories for later
8. **Bulk Actions**: Add multiple to cart at once

## Troubleshooting

### Accessories Not Displaying

**Problem**: Page shows "No hay accesorios disponibles"

**Solutions**:
1. Upload accessories via admin panel
2. Check `/api/accessories` returns data
3. Verify CSV format is correct
4. Check browser console for errors

### Images Not Loading

**Problem**: Placeholder images instead of actual images

**Solutions**:
1. Verify image URLs are accessible
2. Check CORS settings on image host
3. Ensure URLs are complete (include https://)
4. Check browser network tab for 404s

### Prices Not Converting

**Problem**: Prices show as $0 or incorrect amounts

**Solutions**:
1. Verify Price column in CSV has values
2. Check exchange rate is loaded (Redux state)
3. Ensure prices are in USD format
4. Check browser console for conversion errors

### Search Not Working

**Problem**: Search doesn't filter results

**Solutions**:
1. Check searchFilter state is updating
2. Verify useMemo dependencies
3. Check filter logic includes all fields
4. Look for JavaScript errors in console

## Code Examples

### Adding a New Filter

```typescript
// Add state
const [categoryFilter, setCategoryFilter] = useState('')

// Update filtering logic
const filteredAndSortedAccessories = useMemo(() => {
  let filtered = [...transformedAccessories]
  
  // Existing search filter
  if (searchFilter.trim()) {
    // ... existing code
  }
  
  // New category filter
  if (categoryFilter) {
    filtered = filtered.filter(item => 
      item.categoryName === categoryFilter
    )
  }
  
  // ... rest of code
}, [transformedAccessories, searchFilter, categoryFilter, sortOrder])
```

### Adding a New Sort Option

```typescript
// Update sort dropdown
<select
  value={sortOrder}
  onChange={(e) => setSortOrder(e.target.value)}
  className="..."
>
  <option value="Precio: Menor a mayor">Precio: Menor a mayor</option>
  <option value="Precio: Mayor a menor">Precio: Mayor a menor</option>
  <option value="Nombre: A-Z">Nombre: A-Z</option>
</select>

// Update sort logic
if (sortOrder === 'Precio: Menor a mayor') {
  return aPrice - bPrice
} else if (sortOrder === 'Precio: Mayor a menor') {
  return bPrice - aPrice
} else if (sortOrder === 'Nombre: A-Z') {
  return a.name.localeCompare(b.name)
}
```

## Related Documentation

- [ACCESSORIES_FEATURE.md](./ACCESSORIES_FEATURE.md) - Complete feature overview
- [ProductCard Component](../src/components/ProductCard.tsx) - Card component
- [Cart Integration](../src/store/cartSlice.ts) - Cart Redux slice

