# TCGPlayer Internal API Inspection Guide

## 🎯 Goal
Find TCGPlayer's internal API that their frontend uses to load product data.

## 📋 Step-by-Step Instructions

### 1. Open TCGPlayer in Browser
```
https://www.tcgplayer.com/search/pokemon/product?q=charizard
```

### 2. Open DevTools
- **Chrome/Edge:** Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
- Go to **Network** tab

### 3. Filter Network Requests
- Click **XHR** or **Fetch** filter (to show only API calls)
- Or type `api` in the filter box

### 4. Trigger a Search
- Type "Pikachu" in the search box and press Enter
- Watch the Network tab for new requests

### 5. Look for These Patterns

You should see requests like:
```
search-api.tcgplayer.com
mp-search-api.tcgplayer.com
api.tcgplayer.com
```

Or requests with:
```
/search
/products
/listing
/catalog
```

### 6. Click on Each Request

For each XHR/Fetch request, note:

#### **Request URL** (Copy full URL)
Example:
```
https://mp-search-api.tcgplayer.com/v1/search/request
```

#### **Request Method** (GET or POST?)
```
POST
```

#### **Request Headers** (Expand "Request Headers")
Look for:
```
Authorization: Bearer eyJhbGc...
X-Api-Key: abc123...
Content-Type: application/json
```

#### **Request Payload** (Expand "Request Payload" or "Form Data")
Example:
```json
{
  "algorithm": "sales_synonym_v1",
  "from": 0,
  "size": 24,
  "filters": {
    "term": {
      "productLineName": ["Pokemon"]
    }
  },
  "listingSearch": {
    "context": {
      "cart": {}
    }
  },
  "sort": {}
}
```

#### **Response** (Click "Response" tab)
Example:
```json
{
  "results": [
    {
      "productId": 12345,
      "productName": "Pikachu",
      "marketPrice": 5.99,
      ...
    }
  ]
}
```

### 7. Document EVERYTHING

Create a text file with:

```
=== TCGPlayer API Discovery ===

URL: https://mp-search-api.tcgplayer.com/v1/search/request

Method: POST

Headers:
- Content-Type: application/json
- Authorization: Bearer [copy the full token here]
- User-Agent: Mozilla/5.0...

Payload:
{
  "algorithm": "sales_synonym_v1",
  "from": 0,
  "size": 24,
  ...copy everything...
}

Response (sample):
{
  "results": [...copy first result...]
}
```

### 8. Share With Me

Once you have this information, share:
1. The complete request URL
2. All headers (especially Authorization/API keys)
3. The complete payload structure
4. A sample response

## 🔍 What We're Looking For

### Option A: Public Search API
```
POST https://mp-search-api.tcgplayer.com/v1/search/request
```
- No authentication needed
- Or token embedded in page source

### Option B: Authenticated API
```
POST https://api.tcgplayer.com/v1/catalog/products
Authorization: Bearer {token}
```
- Need to extract token from page
- Token might be in JavaScript or cookies

### Option C: GraphQL API
```
POST https://api.tcgplayer.com/graphql
```
- Query structure in payload
- May need authentication

## 💡 Quick Test

Once you find the endpoint, test it:

```bash
curl 'https://ENDPOINT_URL' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer TOKEN_IF_NEEDED' \
  --data-raw '{PAYLOAD_HERE}'
```

If you get JSON back with product data → **SUCCESS!** ✅

---

## ⚡ Next Steps

After you share the API details, I will:
1. Implement the scraper using their internal API
2. Extract all product data and prices
3. Integrate it into our search endpoint
4. Test it end-to-end

This will give us:
- ✅ Real product data
- ✅ Real prices
- ✅ Fast responses (API vs HTML scraping)
- ✅ Reliable structure (JSON vs changing HTML)

**Please do this now and share the details!** 🚀

