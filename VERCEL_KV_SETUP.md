# Vercel KV Setup Guide

This project now uses **Vercel KV** (Redis) for persistent storage of:
- 📦 **Inventory data** (card stock quantities)
- 💰 **Custom dollar price** (admin-set exchange rate)

## Why Vercel KV?

Previously, we used **in-memory storage** which had issues:
- ❌ Data reset on every deployment
- ❌ Multiple serverless instances = inconsistent data
- ❌ Required re-uploading CSV after each deploy

With Vercel KV:
- ✅ Data persists across deployments
- ✅ Shared across all serverless instances
- ✅ Upload once, works forever
- ✅ Free tier: 256 MB + 30k commands/month (more than enough!)

## Setup Instructions

### 1. Create Vercel KV Database

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: **domecoins-6zuu**
3. Click **Storage** tab
4. Click **Create Database**
5. Select **KV** (Redis)
6. Name it: `pokemon-tcg-kv` (or any name)
7. Select region: Choose closest to your users
8. Click **Create**

### 2. Connect to Your Project

After creating the database:

1. Click **Connect to Project**
2. Select your project: **domecoins-6zuu**
3. Select environment: **Production** (and optionally Preview/Development)
4. Click **Connect**

This automatically adds the following environment variables to your project:
```
KV_URL
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN
```

### 3. Redeploy Your Application

Since we just connected the KV database, you need to redeploy:

**Option A - Via Vercel Dashboard:**
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **⋯** (three dots) → **Redeploy**
4. Select **Use existing Build Cache** → **Redeploy**

**Option B - Via Git Push:**
```bash
git push origin feature/vercel-kv-storage
```

Then merge to main and it will auto-deploy.

### 4. Verify Setup

After deployment:

1. Go to your admin panel: `https://domecoins-6zuu.vercel.app/admin`
2. Login with: `dome` / `aldo123`
3. Set a custom dollar price → Should see "Vercel KV (persistent)" in response
4. Upload your inventory CSV → Should see "Vercel KV (persistent)" in response
5. Check Vercel Function Logs for:
   ```
   [KV] Custom price set: 1500
   [KV] Bulk set 247 inventory items
   ```

### 5. Test Persistence

To verify data persists:

1. Upload inventory + set custom price
2. Trigger a new deployment (push any change)
3. After deploy, check cards page → Inventory should still show!
4. Check admin panel → Custom price should still be set!

## Local Development

For local development, you have two options:

### Option A: Use Vercel KV Locally (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Link to your project: `vercel link`
3. Pull environment variables: `vercel env pull .env.local`
4. Run dev server: `npm run dev`

Now your local app will connect to the production Vercel KV!

### Option B: Mock KV Locally

If you don't want to use production KV locally, the code gracefully falls back to in-memory storage if KV env vars are missing.

## Pricing

**Free Tier (Hobby):**
- 256 MB storage
- 30,000 commands per month
- Perfect for this project!

**If you exceed (unlikely):**
- Pro plan: $1/month for 1 GB + 3M commands
- Additional usage: $0.20/GB storage, $0.20/million commands

**Estimated usage for this project:**
- Inventory: ~250 cards × 100 bytes = 25 KB
- Commands: ~1000 requests/day × 30 = 30k/month ✅ Within free tier!

## Monitoring

View your KV usage:
1. Vercel Dashboard → Storage → Your KV database
2. See storage used, commands/month, keys count
3. View data in the **Data Browser** tab

## Troubleshooting

### "KV_URL is not defined" Error

**Solution:** Make sure you:
1. Created the KV database in Vercel
2. Connected it to your project
3. Redeployed after connecting

### Data not persisting

**Check Vercel Function Logs:**
- Look for `[KV]` prefixed logs
- Should see "Custom price set" or "Bulk set X inventory items"
- If you see errors, check that KV is properly connected

### Want to clear all data

Use the DELETE endpoints:
- Inventory: `DELETE /api/inventory`
- Custom price: `DELETE /api/currency/custom`

Or use Vercel Dashboard → Storage → Data Browser → Delete keys

## Files Changed

- ✅ `src/lib/kv.ts` - New KV helper functions
- ✅ `src/app/api/inventory/route.ts` - Now uses KV
- ✅ `src/app/api/currency/custom/route.ts` - Now uses KV
- ✅ `package.json` - Added `@vercel/kv` dependency

## Migration from In-Memory

No data migration needed! After setup:
1. Upload your CSV inventory via admin panel
2. Set your custom dollar price via admin panel
3. Done! Data is now persistent

---

**Questions?** Check Vercel KV docs: https://vercel.com/docs/storage/vercel-kv

