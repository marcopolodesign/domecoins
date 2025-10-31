# Accessories Feature Documentation

## Overview

The Accessories feature allows administrators to upload and manage accessory products (like sleeves, binders, ETBs, etc.) directly through the admin panel. Unlike Pokemon cards, accessories don't require fetching data from the TCG API - all information is stored directly from the CSV upload.

## Features

- **CSV Upload**: Upload accessories data via semicolon-separated CSV files
- **Custom Pricing**: Each accessory can have its own price in USD
- **Image Support**: Store image URLs for each accessory
- **Quantity Management**: Track total quantity and add-to-quantity for inventory
- **No TCG API Dependency**: All data is stored directly without external API calls

## File Structure

### Backend Files

1. **`/src/lib/kv.ts`**
   - Added `Accessory` interface
   - Added `setAccessories()` function
   - Added `getAccessories()` function
   - Added `getAccessoriesCount()` function
   - Supports both Redis and local JSON file storage

2. **`/src/app/api/accessories/route.ts`**
   - `GET /api/accessories` - Retrieve all accessories
   - `POST /api/accessories` - Upload CSV and store accessories

3. **`/data/local/accessories.json`**
   - Local storage file for development (when Redis is not configured)

### Frontend Files

1. **`/src/app/admin/page.tsx`**
   - Added accessories upload section
   - Added state management for accessories
   - Added file upload handler
   - Added stats display

## CSV Format

The CSV file can be **comma-separated** or **semicolon-separated**. The API automatically detects the separator from the header row.

```
TCGplayer Id;Product Line;Set Name;Product Name;Title;Number;Total Quantity;Add to Quantity;Img;Price
```

### Column Descriptions

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| TCGplayer Id | Yes | Unique identifier (can be custom like AC0001) | AC0001 |
| Product Line | Yes | Category of product | Accesorio |
| Set Name | Yes | Set or collection name | Folio |
| Product Name | Yes | Name of the product | ETB Lucario |
| Title | No | Additional title/description | |
| Number | No | Product number | 65 |
| Total Quantity | No | Total quantity available | 65 |
| Add to Quantity | Yes | Quantity to add to inventory | 7 |
| Img | Yes | Image URL | https://res.cloudinary.com/... |
| Price | No | Price in USD | 5.99 |

### Example CSV (Comma-separated)

```csv
TCGplayer Id,Product Line,Set Name,Product Name,Title,Number,Total Quantity,Add to Quantity,Img,Price
AC0001,Accesorio,Folio,ETB Lucario,,65,,7,https://res.cloudinary.com/dqpllefve/image/upload/v1761351533/IMG_4171.heic,5.99
AC0002,Accesorio,Folio,ETB Eevee Prismatic,,65,,12,https://res.cloudinary.com/dqpllefve/image/upload/v1761351533/IMG_4174.heic,4.50
AC0003,Accesorio,Folio,ETB Twilight,,65,,6,https://res.cloudinary.com/dqpllefve/image/upload/v1761351533/IMG_4175.heic,6.00
AC0005,Accesorio,Folio,Penny Sleevs,,100,,100,https://res.cloudinary.com/dqpllefve/image/upload/v1761351533/IMG_4176.heic,2.99
AC0006,Accesorio,Top Load,Ultra Pro x25,,25,,40,https://res.cloudinary.com/dqpllefve/image/upload/v1761351533/IMG_4177.heic,8.99
```

### Example CSV (Semicolon-separated)

```csv
TCGplayer Id;Product Line;Set Name;Product Name;Title;Number;Total Quantity;Add to Quantity;Img;Price
AC0001;Accesorio;Folio;ETB Lucario;;65;;7;https://res.cloudinary.com/dqpllefve/image/upload/v1761351533/IMG_4171.heic;5.99
AC0002;Accesorio;Folio;ETB Eevee Prismatic;;65;;12;https://res.cloudinary.com/dqpllefve/image/upload/v1761351533/IMG_4174.heic;4.50
```

## How to Use

### Admin Panel

1. Navigate to `/admin`
2. Log in with admin credentials
3. Scroll to the "Accesorios" section
4. Click "Cargar Archivo CSV de Accesorios"
5. Select your CSV file (must be semicolon-separated)
6. Click "Subir Accesorios"
7. Wait for confirmation message

### API Endpoints

#### GET /api/accessories

Retrieve all accessories.

**Response:**
```json
{
  "accessories": [
    {
      "id": "AC0001",
      "productLine": "Accesorio",
      "setName": "Folio",
      "productName": "ETB Lucario",
      "title": "",
      "number": "65",
      "totalQuantity": 65,
      "addToQuantity": 7,
      "imageUrl": "https://...",
      "price": 5.99
    }
  ],
  "totalItems": 1,
  "message": "Found 1 accessories"
}
```

#### POST /api/accessories

Upload CSV file with accessories data.

**Request:**
- Content-Type: `text/csv`
- Body: CSV content (semicolon-separated)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "message": "Successfully uploaded 5 accessories"
}
```

## Data Storage

### Redis (Production)

When `REDIS_URL` environment variable is set:
- Accessories are stored in Redis under key: `accessories:data`
- Data is stored as a JSON string array

### Local JSON (Development)

When Redis is not configured:
- Accessories are stored in: `/data/local/accessories.json`
- File structure:
```json
{
  "comment": "Accessories data. Updated from admin CSV upload.",
  "lastUpdated": "2025-10-31T12:00:00.000Z",
  "accessories": [...],
  "count": 5
}
```

## TypeScript Interface

```typescript
export interface Accessory {
  id: string;              // TCGplayer Id (or custom AC#### id)
  productLine: string;     // Category
  setName: string;         // Set/collection name
  productName: string;     // Product name
  title: string;           // Additional title
  number: string;          // Product number
  totalQuantity: number;   // Total quantity
  addToQuantity: number;   // Quantity to add
  imageUrl: string;        // Image URL
  price?: number;          // Price in USD (optional)
}
```

## Key Differences from Cards

| Feature | Pokemon Cards | Accessories |
|---------|--------------|-------------|
| Data Source | TCG API | Direct CSV upload |
| ID Format | TCG numeric IDs | Custom (e.g., AC0001) |
| CSV Separator | Comma (,) | Comma (,) or Semicolon (;) |
| Price Source | TCGPlayer scraping | CSV column |
| Image Source | TCG API | CSV URL |

## Accessories Page

A dedicated page at `/accessories` displays all uploaded accessories in a card grid format.

### Features

- **Search & Filter**: Real-time search across product names, categories, and descriptions
- **Sorting**: Sort by price (low to high, high to low)
- **Stock Status**: Visual indicators for in-stock vs. out-of-stock items
- **Responsive Grid**: Adapts to mobile, tablet, and desktop screens
- **Add to Cart**: Direct integration with shopping cart
- **Price Display**: Shows prices in ARS with current exchange rate

### Navigation

The accessories page is accessible from:
- Header navigation: "Accesorios" link
- Direct URL: `/accessories`

### How It Works

1. Page fetches accessories from `/api/accessories` on mount
2. Transforms accessory data to match ProductCard component format
3. Applies client-side filtering and sorting
4. Renders using the same ProductCard component as the cards page
5. Handles add-to-cart functionality with Redux store

## Future Enhancements

Potential improvements for the accessories feature:

1. **Display Integration**
   - ✅ Create dedicated accessories page (COMPLETED)
   - Show accessories in global search results
   - Add accessories to homepage featured section

2. **Inventory Integration**
   - Link accessories to main inventory system
   - Track stock levels
   - Show availability status

3. **Cart Integration**
   - Allow adding accessories to cart
   - Calculate prices with currency conversion
   - Include in checkout process

4. **Image Management**
   - Support for multiple images per accessory
   - Image upload directly in admin
   - Image optimization

5. **Categories**
   - Add category filtering
   - Create category pages
   - Improve organization

## Troubleshooting

### CSV Upload Fails

**Problem:** "No valid accessories found in CSV"

**Solution:**
- Ensure CSV is comma-separated or semicolon-separated (API auto-detects)
- Verify all required columns are present
- Check that TCGplayer Id and Product Name are not empty
- Make sure there are no special characters breaking the CSV format

### Images Not Loading

**Problem:** Images don't display

**Solution:**
- Verify image URLs are accessible
- Check CORS settings on image host
- Ensure URLs are complete (include https://)

### Stats Not Updating

**Problem:** Accessory count doesn't update after upload

**Solution:**
- Refresh the admin page
- Check browser console for errors
- Verify API response is successful

## Testing

To test the accessories feature:

1. Prepare a test CSV file with sample data
2. Upload via admin panel
3. Check the response message
4. Verify stats update
5. Call GET `/api/accessories` to confirm data is stored
6. Check local file at `/data/local/accessories.json` (development)

## Security Considerations

- Only authenticated admins can upload accessories
- CSV parsing is done server-side
- Input validation on all fields
- File size limits apply (Next.js default: 4MB)
- Malicious URLs are not sanitized (consider adding URL validation)

## Related Files

- `/src/lib/kv.ts` - Storage functions
- `/src/app/api/accessories/route.ts` - API endpoints
- `/src/app/admin/page.tsx` - Admin UI
- `/src/app/accessories/page.tsx` - Accessories catalog page
- `/src/components/Header.tsx` - Navigation with accessories link
- `/src/components/ProductCard.tsx` - Reusable card component
- `/data/local/accessories.json` - Local storage

