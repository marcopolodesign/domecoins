# Upstash Redis Setup Guide (via Vercel Marketplace)

This project now uses **Upstash Redis** (via Vercel Marketplace) for persistent storage of:
- 📦 **Inventory data** (card stock quantities)
- 💰 **Custom dollar price** (admin-set exchange rate)

## Why Upstash Redis?

Previously, we used **in-memory storage** which had issues:
- ❌ Data reset on every deployment
- ❌ Multiple serverless instances = inconsistent data
- ❌ Required re-uploading CSV after each deploy

With Upstash Redis:
- ✅ Data persists across deployments
- ✅ Shared across all serverless instances
- ✅ Upload once, works forever
- ✅ **FREE TIER: 10,000 commands/day** (more than enough!)

## Setup Instructions (5 minutes)

### Step 1: Install Upstash from Vercel Marketplace

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: **domecoins-6zuu**
3. Click **Storage** tab
4. Under "Marketplace Database Providers", find **Upstash**
5. Click on **Upstash**

### Step 2: Create Upstash Redis Database

You'll be redirected to the Upstash integration page:

1. Click **Add Integration** or **Install**
2. Select **Serverless DB (Redis, Vector, Queue, Search)**
3. Choose **Redis** option
4. Configure:
   - **Name**: `pokemon-tcg-redis` (or any name)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
   - **Plan**: **Free** (10k commands/day)
5. Click **Create Database**

### Step 3: Connect to Your Vercel Project

After creating the database:

1. Click **Connect to Project**
2. Select your project: **domecoins-6zuu**
3. Select environments:
   - ✅ **Production** (required)
   - ✅ **Preview** (optional, recommended)
   - ✅ **Development** (optional, for local testing)
4. Click **Connect**

This automatically adds these environment variables to your Vercel project:
```
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### Step 4: Deploy Your Application

The code is already updated to use Upstash Redis. Just deploy:

**Option A - Push current branch:**
```bash
git push origin feature/vercel-kv-storage
```

**Option B - Merge to main:**
```bash
git checkout main
git merge feature/vercel-kv-storage
git push
```

Vercel will automatically detect the new env vars and deploy.

### Step 5: Upload Data (ONE TIME ONLY!)

After deployment completes:

1. Go to: `https://domecoins-6zuu.vercel.app/admin`
2. Login: `dome` / `aldo123`
3. **Upload your inventory CSV file**
   - Response should show: `"storage": "Vercel KV (persistent)"`
4. **Set your custom dollar price**
   - Response should show: `"storage": "Vercel KV (persistent)"`

### Step 6: Verify Persistence 🎯

To confirm data persists across deployments:

1. Make a small change to any file (e.g., add a comment)
2. Push to trigger a new deployment
3. After deploy, check: `https://domecoins-6zuu.vercel.app/cards`
4. Search for a card → **Stock status should still show!**
5. Check admin panel → **Custom price should still be set!**

---

## Local Development

### Option A: Use Production Redis Locally (Recommended)

This connects your local dev environment to the production Upstash Redis:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link to your Vercel project
vercel link

# Pull environment variables (includes Upstash credentials)
vercel env pull .env.local

# Run dev server
npm run dev
```

Now your local app uses the same Redis as production!

### Option B: In-Memory Fallback

If you don't set up Upstash locally, the code automatically falls back to **in-memory storage**:

```bash
# Just run dev without Upstash env vars
npm run dev
```

You'll see this warning:
```
[KV] Upstash Redis not configured. Using in-memory fallback for local development.
```

This is fine for local testing, but data won't persist.

---

## Pricing & Limits

### Upstash Redis Free Tier (Perfect for this project!)

**What you get:**
- 10,000 commands per day
- 256 MB storage
- Global replication (optional)
- REST API access

**Estimated usage for this project:**
- Inventory: ~250 cards × 100 bytes = **25 KB**
- Commands: ~1000 search requests/day × 2 commands each = **2,000 commands/day**
- Result: **Well within free tier!** ✅

**If you exceed (very unlikely):**
- Pay-as-you-go: $0.20 per 100,000 requests
- Pro plan: $10/month for 1M commands/day

---

## Monitoring Usage

### View in Upstash Dashboard

1. Go to: https://console.upstash.com/
2. Select your database: `pokemon-tcg-redis`
3. See:
   - Total requests today
   - Storage used
   - Data browser (view/edit keys)
   - Performance metrics

### View in Vercel Dashboard

1. Go to: Vercel Dashboard → Storage tab
2. See connected integrations
3. Click through to Upstash console

---

## Vercel Function Logs

After uploading inventory or setting custom price, check Vercel logs:

**Successful Upload:**
```
[InventoryAPI] POST request - Uploading CSV to KV...
[InventoryAPI] CSV has 248 lines
[KV] Bulk set 247 inventory items
[InventoryAPI] Upload complete: { processedCount: 247, errorCount: 0, totalCards: 247 }
```

**Successful Custom Price:**
```
[CustomPriceAPI] POST request - Setting custom price in KV
[KV] Custom price set: 1500
```

**Successful Read:**
```
[InventoryAPI] GET request - Total items in KV: 247
[CustomPriceAPI] Returning custom price from KV: 1500
```

---

## Data Structure in Redis

The app uses these Redis keys:

### Inventory
```
inventory:_index          → Set of all product IDs
inventory:250309         → Stock quantity for card 250309
inventory:250314         → Stock quantity for card 250314
...
```

### Custom Price
```
custom_dollar_price         → Price value (e.g., 1500)
custom_dollar_price:updated → ISO timestamp
```

---

## Troubleshooting

### "UPSTASH_REDIS_REST_URL is not defined" Error

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Check if `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` exist
3. If not, re-run the Upstash integration from Storage tab
4. Redeploy after adding env vars

### Data not persisting after upload

**Check these:**

1. **Are env vars set?**
   - Vercel Dashboard → Settings → Environment Variables
   - Should see `UPSTASH_REDIS_REST_URL` and token

2. **Did you redeploy after connecting Upstash?**
   - Environment variables only take effect after redeployment
   - Go to Deployments → Redeploy latest

3. **Check Function Logs:**
   - Look for `[KV]` prefixed logs
   - Should see "Bulk set X inventory items" or "Custom price set"
   - If you see errors, the Redis connection might be failing

4. **Verify in Upstash Dashboard:**
   - Go to https://console.upstash.com/
   - Open Data Browser
   - Search for `inventory:_index` or `custom_dollar_price`
   - Should see your data there

### Want to clear all data?

**Via API:**
```bash
# Clear inventory
curl -X DELETE https://domecoins-6zuu.vercel.app/api/inventory

# Clear custom price
curl -X DELETE https://domecoins-6zuu.vercel.app/api/currency/custom
```

**Via Upstash Dashboard:**
1. Go to: https://console.upstash.com/
2. Open your database
3. Go to **Data Browser** tab
4. Use **Flush All** or delete individual keys

---

## Files Changed

- ✅ `src/lib/kv.ts` - Redis helper functions (with in-memory fallback)
- ✅ `src/app/api/inventory/route.ts` - Now uses Redis
- ✅ `src/app/api/currency/custom/route.ts` - Now uses Redis
- ✅ `package.json` - Added `@upstash/redis` dependency

---

## Comparison: Before vs After

| Feature | Before (In-Memory) | After (Upstash Redis) |
|---------|-------------------|----------------------|
| Data persistence | ❌ Resets on deploy | ✅ Persists forever |
| Multiple instances | ❌ Conflicts | ✅ Shared storage |
| Re-upload needed | ❌ Every deploy | ✅ Once only |
| Cost | ✅ Free | ✅ Free tier |
| Setup | ✅ None | ⚠️ 5 min setup |

---

## Need Help?

- **Upstash Docs**: https://upstash.com/docs/redis
- **Vercel Storage**: https://vercel.com/docs/storage
- **Upstash Dashboard**: https://console.upstash.com/

---

**Ready to deploy?** Follow the steps above and your data will persist permanently! 🚀

