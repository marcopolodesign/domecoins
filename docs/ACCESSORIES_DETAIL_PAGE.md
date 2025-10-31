# Accessories Detail Page - Implementation Guide

## Overview

The `/accessories/[id]` page displays detailed information about a single accessory, similar to the card detail page but optimized for accessories data from CSV uploads (no TCG API scraping).

## Page Location

- **URL Pattern**: `/accessories/[id]`
- **Example**: `/accessories/AC0001`
- **File**: `/src/app/accessories/[id]/page.tsx`

## Key Features

### 1. Data Fetching
- Fetches all accessories from `/api/accessories`
- Finds the matching accessory by ID
- No TCG API calls - all data from CSV upload
- Shows "Accessory Not Found" if ID doesn't exist

### 2. Product Display
- **Large image** with VanillaTilt 3D effect
- **Orange gradient background** (brand color for accessories)
- **Stock badge** (green for in-stock, yellow for on-order)
- **Product details**: Category, Collection, Number, Title
- **Availability section** with stock quantity

### 3. Pricing
- Shows price in **ARS** (converted from USD)
- Shows original **USD price**
- "Consultá precio" if no price available
- Real-time exchange rate conversion

### 4. Add to Cart
- Direct integration with Redux cart
- Respects 3-item limit per product
- Auto-opens cart drawer
- Toast notifications
- Orange-themed button (vs blue for cards)

### 5. Navigation
- **Back button** returns to `/accessories` catalog
- **Automatic routing** from ProductCard based on ID format

## Routing Logic

### ProductCard Component Update

The `ProductCard` component now automatically routes based on product ID:

```typescript
const handleCardClick = () => {
  const productId = card.productId || card.id;
  
  if (productId) {
    // Check if this is an accessory (ID starts with "AC")
    const isAccessory = typeof productId === 'string' && productId.startsWith('AC');
    
    if (isAccessory) {
      router.push(`/accessories/${productId}`);  // Accessories route
    } else {
      router.push(`/cards/${productId}`);        // Cards route
    }
  }
}
```

### ID Format Detection

- **Accessories**: IDs starting with `AC` (e.g., `AC0001`, `AC0002`)
- **Cards**: Numeric IDs (e.g., `123456`, `285396`)

## Page Structure

```
AccessoryDetailPage
├── Back Button (→ /accessories)
├── Grid Layout (2 columns on desktop)
│   ├── Left Column
│   │   ├── Orange Gradient Background
│   │   ├── Stock Badge
│   │   └── Product Image (with VanillaTilt)
│   └── Right Column
│       ├── Title & Product Details
│       ├── Availability Section
│       ├── Price & Add to Cart
│       └── Product ID
```

## Differences from Card Detail Page

| Feature | Card Detail | Accessory Detail |
|---------|-------------|------------------|
| Data Source | TCG API | CSV Upload |
| Background | Type-based gradient | Orange gradient |
| Variants | Multiple printings | Single item |
| Stock Check | API call to inventory | From CSV data |
| Image Source | TCGPlayer CDN | Cloudinary/Custom URL |
| Additional Info | Attacks, HP, Stage, Artist | Category, Collection |
| Button Color | Blue | Orange |
| Back Link | Previous page | /accessories |

## Component State

```typescript
const [accessory, setAccessory] = useState<Accessory | null>(null)
const [loading, setLoading] = useState(true)
const imageRef = useRef<HTMLImageElement>(null)
```

## Data Flow

```
URL: /accessories/AC0001
  ↓
Fetch: /api/accessories
  ↓
Filter: accessories.find(acc => acc.id === 'AC0001')
  ↓
Display: Accessory details
  ↓
Add to Cart: Redux action
```

## Styling

### Theme Colors
- **Primary**: Orange (`orange-600`, `orange-700`)
- **Stock Badge**: Green (in-stock) / Yellow (on-order)
- **Background Gradient**: `linear-gradient(135deg, #fb923c 0%, #f97316 100%)`

### Key Classes
- Container: `container mx-auto px-4`
- Grid: `grid grid-cols-1 lg:grid-cols-2 gap-12`
- Font: `font-thunder` (headers), `font-interphases` (body)
- Image: `400x400px` (vs `290x422px` for cards)

## Loading States

### Initial Load
```tsx
<div className="animate-pulse">
  <div className="h-8 w-24 bg-gray-200 rounded mb-8"></div>
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div className="aspect-square bg-gray-200 rounded-lg"></div>
    <div className="space-y-4">
      <div className="h-10 bg-gray-200 rounded w-3/4"></div>
      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      <div className="h-40 bg-gray-200 rounded"></div>
    </div>
  </div>
</div>
```

### Not Found State
- Custom message: "Accesorio No Encontrado"
- Link to `/accessories` catalog
- Orange-themed styling

## VanillaTilt Integration

Same 3D tilt effect as card detail page:

```typescript
useEffect(() => {
  const currentRef = imageRef.current;
  if (currentRef && !loading && accessory) {
    VanillaTilt.init(currentRef, {
      max: 10,
      speed: 500,
      perspective: 3000,
    });
    
    return () => {
      const tiltInstance = currentRef as any;
      if (tiltInstance.vanillaTilt) {
        tiltInstance.vanillaTilt.destroy();
      }
    };
  }
}, [loading, accessory]);
```

## Cart Integration

### Add to Cart Logic

```typescript
const handleAddToCart = () => {
  const price = accessory.price || 0;
  const uniqueId = `${accessory.id}-normal`;
  
  // Check quantity limit
  const existingItem = cartItems.find(item => item.card.id === uniqueId);
  if (existingItem && existingItem.quantity >= MAX_QUANTITY_PER_VARIANT) {
    toast.error('Ya tenés el máximo de 3 unidades...');
    return;
  }
  
  // Add to cart
  dispatch(addToCart({
    card: { /* accessory data transformed to card format */ },
    quantity: 1,
    priceUsd: price,
    priceArs: getRoundedArsPrice(price * dolarBlueRate),
    inStock: accessory.addToQuantity > 0,
  }));
  
  dispatch(openCart());
  toast.success(`${accessory.productName} agregado al carrito`);
};
```

## Error Handling

### Image Load Error
```typescript
onError={(e) => {
  const target = e.target as HTMLImageElement;
  target.src = '/placeholder-card.svg';
}}
```

### Missing Price
- Shows "Consultá precio" instead of price
- Disables add to cart button
- Shows contact message

### API Error
- Catches fetch errors
- Shows "Accessory Not Found" page
- Provides link back to catalog

## SEO Considerations

Future improvements:
- Add dynamic metadata based on accessory
- Include Open Graph tags
- Add structured data (Product schema)
- Generate static paths for popular accessories

## Testing Checklist

- [ ] Upload accessories via admin
- [ ] Navigate to `/accessories`
- [ ] Click on an accessory card
- [ ] Verify URL is `/accessories/AC####`
- [ ] Check image displays correctly
- [ ] Verify price conversion to ARS
- [ ] Test add to cart functionality
- [ ] Verify stock status display
- [ ] Test back button navigation
- [ ] Test with missing accessory ID (404)
- [ ] Test with accessory without price
- [ ] Verify VanillaTilt 3D effect works
- [ ] Test responsive layouts (mobile/desktop)

## Future Enhancements

1. **Related Accessories**: Show similar items
2. **Image Gallery**: Multiple images per accessory
3. **Reviews**: Customer reviews and ratings
4. **Quantity Selector**: Choose quantity before adding to cart
5. **Share Buttons**: Social media sharing
6. **Breadcrumbs**: Navigation path display
7. **Recently Viewed**: Track and display recently viewed accessories
8. **Wishlist**: Save for later functionality

## Troubleshooting

### Accessory Not Found

**Problem**: Page shows "Accesorio No Encontrado" for valid ID

**Solutions**:
1. Verify accessory was uploaded via admin
2. Check ID format matches CSV (e.g., `AC0001`)
3. Refresh accessories data in admin
4. Check browser console for API errors

### Wrong Route

**Problem**: Clicking accessory card goes to `/cards/AC####`

**Solutions**:
1. Verify ProductCard component has updated routing logic
2. Clear browser cache
3. Check that ID starts with "AC"
4. Rebuild the application

### Image Not Loading

**Problem**: Placeholder image shows instead of actual image

**Solutions**:
1. Verify image URL in CSV is correct
2. Check image URL is accessible (CORS)
3. Ensure Cloudinary URLs are public
4. Check browser network tab for 404s

### Price Not Converting

**Problem**: Price shows as $0 or incorrect

**Solutions**:
1. Verify Price column in CSV has value
2. Check exchange rate is loaded (Redux)
3. Ensure price is in USD format
4. Check dolarBlueRate in Redux DevTools

## Related Files

- `/src/app/accessories/[id]/page.tsx` - Detail page component
- `/src/app/accessories/page.tsx` - Catalog page
- `/src/components/ProductCard.tsx` - Card component with routing
- `/src/app/api/accessories/route.ts` - API endpoint
- `/src/lib/kv.ts` - Storage functions
- `/src/store/cartSlice.ts` - Cart Redux slice

## Code Examples

### Adding Custom Fields

To display additional accessory information:

```typescript
// In the accessory detail page
{accessory.customField && (
  <div className="flex items-center gap-2">
    <span className="text-gray-500 font-interphases font-semibold">
      Custom Field:
    </span>
    <span className="text-gray-800 font-interphases">
      {accessory.customField}
    </span>
  </div>
)}
```

### Changing Image Size

```typescript
// Update image container size
<div 
  className="lg:sticky lg:top-24 self-start"
  style={{ width: '500px', height: '500px', maxWidth: '100%' }}
>
```

### Adding Variant Support

If accessories need variants in the future:

```typescript
const [selectedVariant, setSelectedVariant] = useState<string>('Normal');

// In the UI
<select 
  value={selectedVariant}
  onChange={(e) => setSelectedVariant(e.target.value)}
>
  <option value="Normal">Normal</option>
  <option value="Special">Special Edition</option>
</select>
```

## Performance Notes

- Single API call fetches all accessories (efficient for small catalogs)
- VanillaTilt only initializes after loading completes
- Images use lazy loading and error handling
- Redux state prevents unnecessary re-renders
- Client-side filtering is fast for <100 items

## Accessibility

- Semantic HTML structure
- Alt text on images
- Keyboard navigation support
- Screen reader friendly labels
- Focus states on interactive elements
- ARIA labels where appropriate

